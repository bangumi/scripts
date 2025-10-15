// ==UserScript==
// @name         Bangumi wiki 图片上传增强
// @namespace    https://bgm.tv/group/topic/431819
// @version      1.4.4
// @description  支持直接粘贴，自动转换图片格式，自动压缩，裁切和马赛克，预览
// @author       You
// @match        https://bangumi.tv/character/*/upload_photo
// @match        https://bangumi.tv/character/*/upload_img
// @match        https://bangumi.tv/character/*/edit
// @match        https://bangumi.tv/person/*/upload_photo
// @match        https://bangumi.tv/person/*/upload_img
// @match        https://bangumi.tv/person/*/edit
// @match        https://bangumi.tv/subject/*/upload_img
// @match        https://bangumi.tv/*/new
// @match        https://bangumi.tv/settings
// @match        https://bgm.tv/character/*/upload_photo
// @match        https://bgm.tv/character/*/upload_img
// @match        https://bgm.tv/character/*/edit
// @match        https://bgm.tv/person/*/upload_photo
// @match        https://bgm.tv/person/*/upload_img
// @match        https://bgm.tv/person/*/edit
// @match        https://bgm.tv/subject/*/upload_img
// @match        https://bgm.tv/*/new
// @match        https://bgm.tv/settings
// @match        https://chii.in/character/*/upload_photo
// @match        https://chii.in/character/*/upload_img
// @match        https://chii.in/character/*/edit
// @match        https://chii.in/person/*/upload_photo
// @match        https://chii.in/person/*/upload_img
// @match        https://chii.in/person/*/edit
// @match        https://chii.in/subject/*/upload_img
// @match        https://chii.in/*/new
// @match        https://chii.in/settings
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @require      https://cdn.jsdelivr.net/npm/cropperjs@1.5.12/dist/cropper.min.js
// @require      https://cdn.jsdelivr.net/npm/image-compressor.js@1.1.4/dist/image-compressor.min.js
// @resource     cropperCSS https://cdn.jsdelivr.net/npm/cropperjs@1.5.12/dist/cropper.min.css
// @license      MIT
// @gf           
// ==/UserScript==

(function () {
    'use strict';

// #region 样式与DOM元素初始化
    // 注入必要的CSS样式
    const css = `
        .bgm-preview-container {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
            flex-wrap: wrap;
            align-items: flex-start;
            display: none;
        }

        .bgm-original-preview {
            max-width: 100%;
            position: relative;
            min-height: 100px;
        }

        .bgm-square-preview {
            width: 100px;
            height: 100px;
            overflow: hidden;
            border: 1px solid #ddd;
            position: relative;
        }

        .bgm-preview-image {
            max-width: 100%;
            max-height: 300px;
            border: 1px solid #ddd;
        }

        .bgm-square-image {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top center;
        }

        .bgm-square-image.cropper-mode {
            transform-origin: left top;
        }

        .bgm-preview-text {
            margin-top: 5px;
            font-size: 0.8em;
        }

        .bgm-controls {
            margin-top: 10px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .bgm-clipboard-control {
            margin-bottom: 10px;
        }

        .bgm-mosaic-controls {
            margin-top: 10px;
            display: none;
        }

        .bgm-hint {
            font-size: 0.9em;
            margin-block: 5px;
        }

        .cropper-modal {
            opacity: 0 !important;
        }
        .cropper-container {
            border: 1px solid #ddd;
        }

        .slider-control {
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .slider-control label {
            font-size: 0.9em;
        }

        .slider-control input {
            flex-grow: 1;
            max-width: 200px;
        }

        .brush-size-info {
            font-size: 0.8em;
            margin-top: 5px;
        }

        .mosaic-canvas-container {
            display: inline-block;
            border: 1px solid #ddd;
        }

        /* 粘贴辅助区域 - 完全隐藏 */
        #pasteHelper {
            position: fixed;
            top: -100px;
            left: -100px;
            width: 1px;
            height: 1px;
            opacity: 0;
            outline: none;
            border: none;
            z-index: -1;
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // 添加Cropper.js CSS
    const cropperCSS = GM_getResourceText('cropperCSS');
    const cropperStyle = document.createElement('style');
    cropperStyle.textContent = cropperCSS;
    document.head.appendChild(cropperStyle);

    // 创建隐藏的粘贴辅助区域（用于兼容模式）
    const pasteHelper = document.createElement('textarea');
    pasteHelper.id = 'pasteHelper';
    pasteHelper.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pasteHelper);

    // 直接获取文件输入框
    const fileInput = document.querySelector('input[type="file"][name="picfile"]');
    if (!fileInput) return;

    const isUploadPhotoPage = window.location.pathname.includes('/upload_photo');
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    // 创建UI容器
    const container = document.createElement('div');
    container.className = 'bgm-uploader-container';

    // 剪贴板按钮容器
    const clipboardControl = document.createElement('div');
    clipboardControl.className = 'bgm-clipboard-control';

    // 单一剪贴板按钮
    const getClipboardBtn = document.createElement('button');
    getClipboardBtn.id = 'getClipboardBtn';
    getClipboardBtn.textContent = '获取剪贴板内容';
    clipboardControl.appendChild(getClipboardBtn);

    // 预览区域
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'bgm-preview-container';

    const originalPreview = document.createElement('div');
    originalPreview.className = 'bgm-original-preview';

    const previewImage = document.createElement('img');
    previewImage.className = 'bgm-preview-image';

    const previewText = document.createElement('div');
    previewText.className = 'bgm-preview-text';

    let squarePreview = null;
    let squarePreviewImage = null;

    if (isUploadPhotoPage) {
        squarePreview = document.createElement('div');
        squarePreview.className = 'bgm-square-preview';
        squarePreview.style.display = 'none';

        squarePreviewImage = document.createElement('img');
        squarePreviewImage.className = 'bgm-square-image';

        squarePreview.appendChild(squarePreviewImage);
    }

    // 其他控制按钮
    const controls = document.createElement('div');
    controls.className = 'bgm-controls';

    const cropBtn = document.createElement('button');
    cropBtn.textContent = '裁切图片';
    cropBtn.style.display = 'none';

    const cropConfirmBtn = document.createElement('button');
    cropConfirmBtn.textContent = '确认裁切';
    cropConfirmBtn.style.display = 'none';

    const cropCancelBtn = document.createElement('button');
    cropCancelBtn.textContent = '取消裁切';
    cropCancelBtn.style.display = 'none';

    const mosaicBtn = document.createElement('button');
    mosaicBtn.textContent = '添加马赛克';
    mosaicBtn.style.display = 'none';

    const mosaicConfirmBtn = document.createElement('button');
    mosaicConfirmBtn.textContent = '完成马赛克';
    mosaicConfirmBtn.style.display = 'none';

    const mosaicCancelBtn = document.createElement('button');
    mosaicCancelBtn.textContent = '取消马赛克';
    mosaicCancelBtn.style.display = 'none';

    // 马赛克大小控制
    const mosaicControls = document.createElement('div');
    mosaicControls.className = 'bgm-mosaic-controls';

    const blockSizeControl = document.createElement('div');
    blockSizeControl.className = 'slider-control';

    const blockSizeLabel = document.createElement('label');
    blockSizeLabel.htmlFor = 'mosaicBlockSize';
    blockSizeLabel.textContent = '马赛克比例:';

    const blockSizeSlider = document.createElement('input');
    blockSizeSlider.type = 'range';
    blockSizeSlider.id = 'mosaicBlockSize';
    blockSizeSlider.min = '1';
    blockSizeSlider.max = '10';
    blockSizeSlider.value = '3';

    const blockSizeValue = document.createElement('span');
    blockSizeValue.id = 'blockSizeValue';
    blockSizeValue.textContent = '3%';

    const brushSizeInfo = document.createElement('div');
    brushSizeInfo.className = 'brush-size-info';
    brushSizeInfo.textContent = '实际大小: 计算中...';

    blockSizeControl.append(blockSizeLabel, blockSizeSlider, blockSizeValue);
    mosaicControls.appendChild(blockSizeControl);
    mosaicControls.appendChild(brushSizeInfo);

    // 组装UI
    originalPreview.appendChild(previewImage);
    previewWrapper.append(originalPreview);

    if (isUploadPhotoPage && squarePreview) {
        previewWrapper.appendChild(squarePreview);
    }

    controls.append(cropBtn, mosaicBtn, cropConfirmBtn, cropCancelBtn, mosaicConfirmBtn, mosaicCancelBtn);
    container.append(clipboardControl, previewWrapper, previewText, controls, mosaicControls);
    fileInput.parentNode.insertBefore(container, fileInput.nextSibling);
// #endregion

// #region 变量定义
    const allowedImageTypes = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif'
    };
    const allowedExtensions = Object.values(allowedImageTypes);
    let currentFile = null;
    let cropper = null;
    let isCropping = false;
    let isMosaicing = false;
    let mosaicSizePercent = 3;
    let originalCanvas = null;
    let tempCanvas = null;
    let canvasContainer = null;
    let ctx = null;
    let isDrawing = false;
    const MAX_CANVAS_WIDTH = 700;
    let canvasScale = 1.0;
// #endregion

// #region 工具函数
    // 显示/隐藏编辑按钮
    function showEditButtons() {
        cropBtn.style.display = 'inline-block';
        mosaicBtn.style.display = 'inline-block';
    }

    function hideEditButtons() {
        cropBtn.style.display = 'none';
        mosaicBtn.style.display = 'none';
    }

    // 转换图片为JPG格式
    function convertToJpg(file) {
        return new Promise((resolve, reject) => {
            if (allowedImageTypes[file.type]) {
                resolve(file);
                return;
            }

            previewText.textContent = `正在转换格式...`;
            previewWrapper.style.display = 'flex';

            const reader = new FileReader();

            reader.onload = function (e) {
                const img = new Image();
                img.crossOrigin = 'anonymous';

                img.onload = function () {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // 设置Canvas尺寸与图片一致
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;

                        // 白色背景
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // 绘制图片，保持原始尺寸
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        canvas.toBlob(blob => {
                            if (!blob) {
                                throw new Error('格式转换失败');
                            }

                            const baseName = file.name.replace(/\.[^/.]+$/, "");
                            const newFileName = `${baseName}.jpg`;
                            const newFile = new File([blob], newFileName, { type: 'image/jpeg' });

                            resolve(newFile);
                        }, 'image/jpeg', 1);
                    } catch (error) {
                        reject(new Error(`转换失败: ${error.message}`));
                    }
                };

                img.onerror = function (e) {
                    console.error('图片加载错误:', e);
                    reject(new Error('无法加载图片'));
                };

                // 修复SVG的MIME类型
                let src = e.target.result;
                if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
                    src = src.replace('data:image/svg', 'data:image/svg+xml');
                }

                img.src = src;
            };

            reader.onerror = function () {
                reject(new Error('读取文件失败'));
            };

            reader.readAsDataURL(file);
        });
    }

    // 压缩图片至2MB以内
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            if (file.size <= MAX_FILE_SIZE) {
                resolve(file);
                return;
            }

            previewText.textContent = `正在压缩图片...`;

            new ImageCompressor(file, {
                quality: 0.8,
                maxWidth: 2000,
                maxHeight: 2000,
                success(result) {
                    if (result.size > MAX_FILE_SIZE) {
                        new ImageCompressor(result, {
                            quality: 0.5,
                            maxWidth: 1600,
                            maxHeight: 1600,
                            success(secondResult) {
                                if (secondResult.size > MAX_FILE_SIZE) {
                                    new ImageCompressor(secondResult, {
                                        quality: 0.3,
                                        maxWidth: 1200,
                                        maxHeight: 1200,
                                        success(finalResult) {
                                            const compressedFile = new File(
                                                [finalResult],
                                                file.name,
                                                { type: file.type }
                                            );
                                            resolve(compressedFile);
                                        },
                                        error() {
                                            reject(new Error(`压缩失败`));
                                        }
                                    });
                                } else {
                                    const compressedFile = new File(
                                        [secondResult],
                                        file.name,
                                        { type: file.type }
                                    );
                                    resolve(compressedFile);
                                }
                            },
                            error() {
                                reject(new Error(`压缩失败`));
                            }
                        });
                    } else {
                        const compressedFile = new File(
                            [result],
                            file.name,
                            { type: file.type }
                        );
                        resolve(compressedFile);
                    }
                },
                error() {
                    reject(new Error(`压缩失败`));
                }
            });
        });
    }

    // 计算实际马赛克大小
    function calculateMosaicSize() {
        if (!originalCanvas) return 1;

        const baseSize = Math.min(originalCanvas.width, originalCanvas.height);
        return Math.max(2, Math.round(baseSize * mosaicSizePercent / 100));
    }

    // 更新马赛克大小显示
    function updateMosaicSizeDisplay() {
        if (isMosaicing && originalCanvas) {
            const pixelSize = calculateMosaicSize();
            brushSizeInfo.textContent = `实际大小: ${pixelSize}px`;
        }
    }

    // 检查是否是图片URL
    function isImageUrl(text) {
        try {
            if (text.startsWith('//')) text = `https:${text}`;
            const url = new URL(text);
            const ext = url.pathname.split('.').pop().toLowerCase();
            console.debug(ext)
            return allowedExtensions.includes(ext) ||
                   ['bmp', 'webp', 'tiff', 'svg', 'jpeg', 'avif'].includes(ext);
        } catch {
            return false;
        }
    }

    // 从URL获取图片文件
    function fetchImageFromUrl(url) {
        previewText.textContent = '正在下载图片...';
        previewWrapper.style.display = 'flex';
        if (squarePreview) squarePreview.style.display = 'none';

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                overrideMimeType: 'image/*',
                onload: function (response) {
                    const blob = response.response;
                    let type = 'image/jpeg';

                    const extension = url.split('.').pop().toLowerCase();
                    if (extension === 'png') type = 'image/png';
                    else if (extension === 'gif') type = 'image/gif';
                    else if (extension === 'webp') type = 'image/webp';

                    const contentType = response.responseHeaders.match(/Content-Type:\s*(image\/\w+)/i);
                    if (contentType && contentType[1]) {
                        type = contentType[1];
                    }

                    const fileName = url.split('/').pop();
                    const correctedBlob = new Blob([blob], { type });
                    const file = new File([correctedBlob], fileName, { type });

                    convertToJpg(file)
                        .then(convertedFile => compressImage(convertedFile))
                        .then(compressedFile => resolve(compressedFile))
                        .catch(e => {
                            console.error(e);
                            reject(new Error('下载后处理失败'));
                        });
                },
                onerror: function () {
                    reject(new Error('图片下载失败'));
                }
            });
        });
    }

    // 更新正方形预览
    function updateSquarePreview() {
        if (!squarePreviewImage) return;

        if (isCropping && cropper) {
            const canvas = cropper.getCroppedCanvas();
            if (!canvas) return;

            const scale = 100 / canvas.width;
            squarePreviewImage.src = canvas.toDataURL();
            squarePreviewImage.style.width = `${canvas.width * scale}px`;
            squarePreviewImage.style.height = `${canvas.height * scale}px`;
            squarePreviewImage.style.left = '50%';
            squarePreviewImage.style.transform = 'translateX(-50%)';
            squarePreviewImage.classList.add('cropper-mode');
        } else {
            squarePreviewImage.src = previewImage.src;
            squarePreviewImage.style.width = '100%';
            squarePreviewImage.style.height = '100%';
            squarePreviewImage.style.left = '0';
            squarePreviewImage.style.transform = 'none';
            squarePreviewImage.classList.remove('cropper-mode');
        }
    }
// #endregion

// #region 裁切功能
    function initCropper() {
        if (cropper) {
            cropper.destroy();
        }

        isCropping = true;
        cropper = new Cropper(previewImage, {
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            movable: true,
            rotatable: true,
            scalable: true,
            zoomable: true,
            background: false,
            ready: updateSquarePreview,
            cropend: updateSquarePreview
        });

        updateSquarePreview();
    }

    function startCropping(e) {
        e.preventDefault();
        if (!currentFile || isMosaicing) return;

        initCropper();
        cropBtn.style.display = 'none';
        mosaicBtn.style.display = 'none';
        cropConfirmBtn.style.display = 'inline-block';
        cropCancelBtn.style.display = 'inline-block';
        previewText.textContent = '调整裁切区域，点击"确认裁切"';
    }

    function confirmCrop(e) {
        e.preventDefault();
        if (!cropper || !isCropping) return;

        cropper.getCroppedCanvas().toBlob(blob => {
            const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '_cropped.png';
            const croppedFile = new File([blob], fileName, { type: 'image/png' });

            compressImage(croppedFile).then(compressedFile => {
                currentFile = compressedFile;

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(currentFile);
                fileInput.files = dataTransfer.files;

                updatePreview(currentFile);
                endCropping();
            }).catch(() => {
                previewText.textContent = `裁切后压缩失败`;
            });
        }, 'image/png');
    }

    function cancelCrop(e) {
        e.preventDefault();
        if (!isCropping) return;
        updatePreview(currentFile);
        endCropping();
    }

    function endCropping() {
        isCropping = false;
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        showEditButtons();
        cropConfirmBtn.style.display = 'none';
        cropCancelBtn.style.display = 'none';
        updateSquarePreview();
    }
// #endregion

// #region 马赛克功能
    function initMosaic() {
        if (canvasContainer) {
            canvasContainer.remove();
        }

        canvasContainer = document.createElement('div');
        canvasContainer.className = 'mosaic-canvas-container';

        originalCanvas = document.createElement('canvas');
        const oCtx = originalCanvas.getContext('2d');

        tempCanvas = document.createElement('canvas');
        ctx = tempCanvas.getContext('2d');

        originalCanvas.width = previewImage.naturalWidth;
        originalCanvas.height = previewImage.naturalHeight;
        tempCanvas.width = previewImage.naturalWidth;
        tempCanvas.height = previewImage.naturalHeight;

        oCtx.drawImage(previewImage, 0, 0);
        ctx.drawImage(previewImage, 0, 0);

        canvasScale = 1.0;
        if (originalCanvas.width > MAX_CANVAS_WIDTH) {
            canvasScale = MAX_CANVAS_WIDTH / originalCanvas.width;
        }

        const scaledWidth = originalCanvas.width * canvasScale;
        const scaledHeight = originalCanvas.height * canvasScale;
        canvasContainer.style.width = `${scaledWidth}px`;
        canvasContainer.style.height = `${scaledHeight}px`;

        tempCanvas.style.width = `${scaledWidth}px`;
        tempCanvas.style.height = `${scaledHeight}px`;
        tempCanvas.style.display = 'block';

        canvasContainer.appendChild(tempCanvas);

        const parent = previewImage.parentNode;
        parent.replaceChild(canvasContainer, previewImage);

        bindTempCanvasEvents();

        updateSquarePreview();
        updateMosaicSizeDisplay();
    }

    function bindTempCanvasEvents() {
        if (!tempCanvas) return;

        tempCanvas.addEventListener('mousedown', function(e) {
            if (!isMosaicing) return;

            if (e.button === 0) {
                isDrawing = true;
                drawMosaic(e);
            }
        });

        tempCanvas.addEventListener('contextmenu', function(e) {
            if (isMosaicing) {
                e.preventDefault();
            }
        });
    }

    function startMosaicing(e) {
        e.preventDefault();
        if (!currentFile || isCropping) return;

        isMosaicing = true;
        initMosaic();

        cropBtn.style.display = 'none';
        mosaicBtn.style.display = 'none';
        mosaicConfirmBtn.style.display = 'inline-block';
        mosaicCancelBtn.style.display = 'inline-block';
        mosaicControls.style.display = 'block';
        previewText.textContent = '按住鼠标左键添加马赛克';
    }

    function drawMosaic(e) {
        if (!isDrawing || !ctx || !originalCanvas || !tempCanvas || e.button !== 0) return;

        const rect = tempCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / canvasScale);
        const y = Math.floor((e.clientY - rect.top) / canvasScale);

        if (x < 0 || x >= originalCanvas.width || y < 0 || y >= originalCanvas.height) {
            return;
        }

        const blockSize = calculateMosaicSize();

        const imageData = ctx.getImageData(
            Math.max(0, x - blockSize/2),
            Math.max(0, y - blockSize/2),
            blockSize,
            blockSize
        );
        const data = imageData.data;

        let r = 0, g = 0, b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
            Math.max(0, x - blockSize/2),
            Math.max(0, y - blockSize/2),
            blockSize,
            blockSize
        );

        updateSquarePreview();
    }

    function confirmMosaic(e) {
        e.preventDefault();
        if (!isMosaicing || !tempCanvas || !canvasContainer) return;

        tempCanvas.toBlob(blob => {
            const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '_mosaic.jpg';
            const mosaicFile = new File([blob], fileName, { type: 'image/jpeg' });

            compressImage(mosaicFile).then(compressedFile => {
                currentFile = compressedFile;

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(currentFile);
                fileInput.files = dataTransfer.files;

                const parent = canvasContainer.parentNode;
                previewImage.src = tempCanvas.toDataURL();
                previewImage.style.maxWidth = '100%';
                previewImage.style.maxHeight = '300px';
                parent.replaceChild(previewImage, canvasContainer);

                originalCanvas = null;
                tempCanvas = null;
                canvasContainer = null;
                ctx = null;

                endMosaicing();
                updatePreview(currentFile);
            }).catch(() => {
                previewText.textContent = `马赛克处理失败`;
            });
        }, 'image/jpeg', 0.95);
    }

    function cancelMosaic(e) {
        e.preventDefault();
        if (!isMosaicing || !tempCanvas || !canvasContainer) return;

        const parent = canvasContainer.parentNode;
        previewImage.style.maxWidth = '100%';
        previewImage.style.maxHeight = '300px';
        parent.replaceChild(previewImage, canvasContainer);

        originalCanvas = null;
        tempCanvas = null;
        canvasContainer = null;
        ctx = null;

        endMosaicing();
        updatePreview(currentFile);
    }

    function endMosaicing() {
        isMosaicing = false;
        isDrawing = false;
        showEditButtons();
        mosaicConfirmBtn.style.display = 'none';
        mosaicCancelBtn.style.display = 'none';
        mosaicControls.style.display = 'none';
    }
// #endregion

// #region 预览更新
    async function updatePreview(file) {
        try {
            const convertedFile = await convertToJpg(file);
            const compressedFile = await compressImage(convertedFile);

            if (!compressedFile) {
                previewWrapper.style.display = 'none';
                controls.style.display = 'none';
                mosaicControls.style.display = 'none';
                hideEditButtons();
                if (squarePreview) squarePreview.style.display = 'none';
                return false;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                let extraInfo = '';
                if (file.name !== convertedFile.name) {
                    extraInfo += ` (已转换格式)`;
                }
                if (convertedFile.size > compressedFile.size) {
                    const originalSizeMB = (convertedFile.size / (1024 * 1024)).toFixed(2);
                    const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
                    extraInfo += ` (已压缩: ${originalSizeMB}MB → ${compressedSizeMB}MB)`;
                }

                previewText.textContent = `${compressedFile.name} (${Math.round(compressedFile.size / 1024)}KB)${extraInfo}`;
                previewWrapper.style.display = 'flex';
                controls.style.display = 'flex';

                showEditButtons();

                if (isUploadPhotoPage && squarePreview) {
                    squarePreview.style.display = 'block';
                    updateSquarePreview();
                }

                endCropping();
                endMosaicing();
            };
            reader.readAsDataURL(compressedFile);
            currentFile = compressedFile;
            return true;
        } catch (error) {
            previewText.textContent = `处理失败: ${error.message}`;
            previewWrapper.style.display = 'flex';
            controls.style.display = 'flex';
            mosaicControls.style.display = 'none';
            hideEditButtons();
            if (squarePreview) squarePreview.style.display = 'none';
            return false;
        }
    }
// #endregion

// #region 剪贴板处理
    async function processClipboardData(clipboardData) {
        try {
            if (clipboardData.items) {
                for (let i = 0; i < clipboardData.items.length; i++) {
                    const item = clipboardData.items[i];
                    if (item.type.indexOf('image') !== -1) {
                        const blob = item.getAsFile();
                        if (blob) {
                            await updatePreview(blob);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(currentFile || blob);
                            fileInput.files = dataTransfer.files;
                            return true;
                        }
                    }
                }
            }

            let text;
            if (typeof clipboardData.text === 'function') {
                text = await clipboardData.text();
            } else if (clipboardData.getData) {
                text = clipboardData.getData('text/plain');
            }

            if (text) {
                const trimmedText = text.trim();
                if (isImageUrl(trimmedText)) {
                    try {
                        const imageFile = await fetchImageFromUrl(trimmedText);
                        if (imageFile) {
                            await updatePreview(imageFile);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(currentFile || imageFile);
                            fileInput.files = dataTransfer.files;
                            return true;
                        }
                    } catch (error) {
                        previewText.textContent = error.message;
                        previewWrapper.style.display = 'flex';
                        if (squarePreview) squarePreview.style.display = 'none';
                    }
                } else {
                    previewText.textContent = '未发现图片内容';
                    previewWrapper.style.display = 'flex';
                }
            }
        } catch {
            previewText.textContent = '处理内容失败';
            previewWrapper.style.display = 'flex';
        }
        return false;
    }

    async function handleClipboard(e) {
        e.preventDefault();
        if (navigator.clipboard && navigator.clipboard.read) {
            try {
                previewText.textContent = '正在获取剪贴板...';
                previewWrapper.style.display = 'flex';

                // 尝试读取图片
                const clipboardItems = await navigator.clipboard.read();
                for (const item of clipboardItems) {
                    for (const type of item.types) {
                        if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            if (blob) {
                                const fileName = `clipboard-${Date.now()}.${type.split('/')[1] || 'jpg'}`;
                                const file = new File([blob], fileName, { type: blob.type });
                                await updatePreview(file);
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(currentFile || file);
                                fileInput.files = dataTransfer.files;
                                return;
                            }
                        }
                    }
                }

                // 尝试读取文本
                const text = await navigator.clipboard.readText();
                if (text) {
                    const trimmedText = text.trim();
                    if (isImageUrl(trimmedText)) {
                        const imageFile = await fetchImageFromUrl(trimmedText);
                        if (imageFile) {
                            await updatePreview(imageFile);
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(currentFile || imageFile);
                            fileInput.files = dataTransfer.files;
                            return;
                        }
                    } else {
                        previewText.textContent = '未发现图片内容';
                    }
                } else {
                    previewText.textContent = '剪贴板为空';
                }
            } catch {
                startCompatibilityMode();
            }
        } else {
            startCompatibilityMode();
        }
    }

    function startCompatibilityMode() {
        pasteHelper.value = '';
        pasteHelper.focus();

        previewText.textContent = '请在此粘贴内容';
        previewWrapper.style.display = 'flex';

        const handlePaste = async function(e) {
            e.stopPropagation();
            e.preventDefault();

            await processClipboardData(e.clipboardData);

            pasteHelper.blur();
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('click', handleClickOutside);
        };

        // 点击外部取消
        const handleClickOutside = function() {
            pasteHelper.blur();
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('click', handleClickOutside);
            if (previewText.textContent === '请在此粘贴内容') {
                previewText.textContent = '操作已取消';
            }
        };

        document.addEventListener('paste', handlePaste);
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }
// #endregion

// #region 事件监听
    // 裁切相关事件
    cropBtn.addEventListener('click', startCropping);
    cropConfirmBtn.addEventListener('click', confirmCrop);
    cropCancelBtn.addEventListener('click', cancelCrop);

    // 马赛克相关事件
    mosaicBtn.addEventListener('click', startMosaicing);
    mosaicConfirmBtn.addEventListener('click', confirmMosaic);
    mosaicCancelBtn.addEventListener('click', cancelMosaic);

    // 剪贴板按钮事件
    getClipboardBtn.addEventListener('click', handleClipboard);

    // 马赛克比例调整事件
    blockSizeSlider.addEventListener('input', function() {
        mosaicSizePercent = parseInt(this.value);
        blockSizeValue.textContent = `${mosaicSizePercent}%`;
        updateMosaicSizeDisplay();
    });

    // 鼠标绘制事件
    document.addEventListener('mousemove', function(e) {
        if (isMosaicing && isDrawing && tempCanvas && e.target === tempCanvas) {
            drawMosaic(e);
        }
    });

    document.addEventListener('mouseup', function() {
        isDrawing = false;
    });

    document.addEventListener('mouseleave', function() {
        isDrawing = false;
    });

    // 文件输入事件
    fileInput.addEventListener('change', async function () {
        if (this.files.length > 0) {
            await updatePreview(this.files[0]);
        } else {
            hideEditButtons();
        }
    });
    if (fileInput.files.length > 0) {
        updatePreview(fileInput.files[0]);
    }

    // 全局粘贴事件
    document.addEventListener('paste', async function (e) {
        const activeElement = document.activeElement;
        if (!activeElement ||
            !(activeElement.tagName === 'INPUT' ||
             activeElement.tagName === 'TEXTAREA' ||
             activeElement.isContentEditable)) {

            const handled = await processClipboardData(e.clipboardData);
            if (handled) {
                e.preventDefault();
            }
        }
    });

    // 添加提示信息
    const hint = document.createElement('div');
    hint.className = 'bgm-hint';
    hint.textContent = '提示：点击按钮获取剪贴板内容，或直接按 Ctrl+V 粘贴图片';
    fileInput.parentNode.insertBefore(hint, fileInput.nextSibling);
// #endregion
})();
