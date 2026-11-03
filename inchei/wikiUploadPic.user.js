// ==UserScript==
// @name         Bangumi wiki 图片上传增强
// @namespace    https://bgm.tv/group/topic/431819
// @homepage     https://bgm.tv/group/topic/431819
// @version      1.7.0
// @description  支持直接粘贴或拖入，自动转换图片格式，自动压缩，旋转、裁切和马赛克，预览；新建条目时自动上传封面
// @author       You
// @match        https://bangumi.tv/character/*/upload_photo
// @match        https://bangumi.tv/character/*/upload_img
// @match        https://bangumi.tv/character/*/edit
// @match        https://bangumi.tv/person/*/upload_photo
// @match        https://bangumi.tv/person/*/upload_img
// @match        https://bangumi.tv/person/*/edit
// @match        https://bangumi.tv/subject/*/upload_img
// @match        https://bangumi.tv/*/new
// @match        https://bangumi.tv/new_subject/*
// @match        https://bangumi.tv/settings
// @match        https://bgm.tv/character/*/upload_photo
// @match        https://bgm.tv/character/*/upload_img
// @match        https://bgm.tv/character/*/edit
// @match        https://bgm.tv/person/*/upload_photo
// @match        https://bgm.tv/person/*/upload_img
// @match        https://bgm.tv/person/*/edit
// @match        https://bgm.tv/subject/*/upload_img
// @match        https://bgm.tv/*/new
// @match        https://bgm.tv/new_subject/*
// @match        https://bgm.tv/settings
// @match        https://chii.in/character/*/upload_photo
// @match        https://chii.in/character/*/upload_img
// @match        https://chii.in/character/*/edit
// @match        https://chii.in/person/*/upload_photo
// @match        https://chii.in/person/*/upload_img
// @match        https://chii.in/person/*/edit
// @match        https://chii.in/subject/*/upload_img
// @match        https://chii.in/*/new
// @match        https://chii.in/new_subject/*
// @match        https://chii.in/settings
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/cropperjs@2.3.1/dist/cropper.min.js
// @license      MIT
// @gf           https://greasyfork.org/zh-CN/scripts/545636
// ==/UserScript==

/* global Cropper */

(function () {
  'use strict';

  // #region 样式与DOM元素初始化
  // 注入必要的CSS样式
  const css = (strings, ...values) => strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '');

  const style = document.createElement('style');
  style.textContent = css`
    .bgm-preview-container {
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

    .bgm-cropper-canvas {
      width: 100%;
      height: 300px;
      border: 1px solid #ddd;
    }

    .bgm-rotate-handle {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 1px solid #fff;
      border-radius: 50%;
      background-color: #39f;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
      cursor: grab;
      touch-action: none;
    }

    .bgm-rotate-handle::before {
      content: '↻';
      color: #fff;
      display: block;
      font-size: 12px;
      line-height: 15px;
      text-align: center;
    }

    .bgm-rotate-handle.active {
      cursor: grabbing;
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
  document.head.appendChild(style);

  // 创建隐藏的粘贴辅助区域（用于兼容模式）
  const pasteHelper = document.createElement('textarea');
  pasteHelper.id = 'pasteHelper';
  pasteHelper.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pasteHelper);

  // /new_subject/{type} 页面的表单自身没有图片输入框：注入一个自用 input，
  // 提交时改走两步请求：XHR 创建条目 → /subject/{id}/upload_img 上传封面。
  // 请求处理移植自 bangumi-new-wiki-helper（MIT）的 sendForm / uploadSubjectCover
  const isNewSubjectPage = /^\/new_subject\//.test(window.location.pathname);
  const createForm = isNewSubjectPage
    ? document.querySelector('form[name=create_subject]')
    : null;
  if (isNewSubjectPage && !createForm) return;

  // 直接获取文件输入框
  let fileInput = null;
  if (isNewSubjectPage) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
  } else {
    fileInput = document.querySelector('input[type="file"][name="picfile"]');
  }
  if (!fileInput) return;

  const isUploadPhotoPage = window.location.pathname.includes('/upload_photo');
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
  const MAX_COMPRESS_DIM = 4096; // 压缩画布最大边长（超出部分等比缩小）

  // 创建UI容器
  const container = document.createElement('div');
  container.className = 'bgm-uploader-container';

  // 剪贴板按钮容器
  const clipboardControl = document.createElement('div');
  clipboardControl.className = 'bgm-clipboard-control';

  // 单一剪贴板按钮
  const getClipboardBtn = document.createElement('button');
  getClipboardBtn.id = 'getClipboardBtn';
  getClipboardBtn.type = 'button';
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
  cropBtn.type = 'button';
  cropBtn.textContent = '裁切和旋转';
  cropBtn.style.display = 'none';

  const cropConfirmBtn = document.createElement('button');
  cropConfirmBtn.type = 'button';
  cropConfirmBtn.textContent = '确认裁切';
  cropConfirmBtn.style.display = 'none';

  const cropCancelBtn = document.createElement('button');
  cropCancelBtn.type = 'button';
  cropCancelBtn.textContent = '取消裁切';
  cropCancelBtn.style.display = 'none';

  const mosaicBtn = document.createElement('button');
  mosaicBtn.type = 'button';
  mosaicBtn.textContent = '添加马赛克';
  mosaicBtn.style.display = 'none';

  const mosaicConfirmBtn = document.createElement('button');
  mosaicConfirmBtn.type = 'button';
  mosaicConfirmBtn.textContent = '完成马赛克';
  mosaicConfirmBtn.style.display = 'none';

  const mosaicCancelBtn = document.createElement('button');
  mosaicCancelBtn.type = 'button';
  mosaicCancelBtn.textContent = '取消马赛克';
  mosaicCancelBtn.style.display = 'none';

  // 旋转按钮：仅在裁切模式内显示，由 Cropper 旋转画布
  const rotateLBtn = document.createElement('button');
  rotateLBtn.type = 'button';
  rotateLBtn.textContent = '左旋90°';
  rotateLBtn.style.display = 'none';

  const rotateRBtn = document.createElement('button');
  rotateRBtn.type = 'button';
  rotateRBtn.textContent = '右旋90°';
  rotateRBtn.style.display = 'none';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = '清除图片';
  clearBtn.style.display = 'none';

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

  controls.append(cropBtn, mosaicBtn, rotateLBtn, rotateRBtn, cropConfirmBtn, cropCancelBtn, mosaicConfirmBtn, mosaicCancelBtn, clearBtn);
  container.append(clipboardControl, previewWrapper, previewText, controls, mosaicControls);
  if (isNewSubjectPage) {
    // 合成输入框没有 name，不会被表单提交；容器插在表单之后
    clipboardControl.insertBefore(fileInput, getClipboardBtn);
    createForm.parentNode.insertBefore(container, createForm.nextSibling);
  } else {
    fileInput.parentNode.insertBefore(container, fileInput.nextSibling);
  }
  // #endregion

  // #region 变量定义
  const allowedImageTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif'
  };
  const allowedExtensions = Object.values(allowedImageTypes);
  let currentFile = null;
  // 当前已处理完成、可随创建请求上送的图片（预览处理失败时会被置空）
  let pendingImage = null;
  let cropper = null;
  // 旋转拖拽状态：手柄绕画布中心细调任意角度
  let rotateHandle = null;
  let isRotating = false;
  let rotateLastAngle = 0;
  let rotateCenter = null;
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
    clearBtn.style.display = 'inline-block';
  }

  function hideEditButtons() {
    cropBtn.style.display = 'none';
    mosaicBtn.style.display = 'none';
    clearBtn.style.display = 'none';
  }

  // 清除当前待上传图片并复位预览 UI（程序清空 input 不触发 change，复位需自理）
  function clearPendingImage() {
    endCropping();
    endMosaicing();
    pendingImage = null;
    currentFile = null;
    fileInput.value = '';
    // 转换/下载/读取剪贴板等流程会先展示预览框，必须清掉 src 避免闪现已清除的旧图
    previewImage.removeAttribute('src');
    previewWrapper.style.display = 'none';
    controls.style.display = 'none';
    mosaicControls.style.display = 'none';
    if (squarePreview) squarePreview.style.display = 'none';
    previewText.textContent = '';
  }

  // 转换图片为JPG格式
  function convertToJpg(file) {
    return new Promise((resolve, reject) => {
      if (allowedImageTypes[file.type]) {
        resolve(file);
        return;
      }

      previewText.textContent = '正在转换格式...';
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

              const baseName = file.name.replace(/\.[^/.]+$/, '');
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

  // 以指定质量把图片绘制到 JPEG 画布（透明区域垫白，与格式转换行为一致）
  function encodeJpeg(img, width, height, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('压缩失败'))),
        'image/jpeg',
        quality
      );
    });
  }

  // 二分搜索不超出上限的最大压缩质量（约 6 次编码直接逼近目标体积）；
  // 连最低质量都超限时按体积差距降采样，再来一轮
  async function compressToTargetSize(img, width, height) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let lo = 0.05;
      let hi = 0.95;
      let best = null;
      let oversize = null;

      while (hi - lo > 0.02) {
        const mid = (lo + hi) / 2;
        const blob = await encodeJpeg(img, width, height, mid);
        if (blob.size <= MAX_FILE_SIZE) {
          best = blob;
          lo = mid;
        } else {
          oversize = blob;
          hi = mid;
        }
      }

      if (best) {
        return best;
      }

      const ratio = Math.sqrt(MAX_FILE_SIZE / oversize.size);
      width = Math.max(64, Math.round(width * ratio));
      height = Math.max(64, Math.round(height * ratio));
    }

    throw new Error('压缩失败');
  }

  // 压缩图片
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (file.size <= MAX_FILE_SIZE) {
        resolve(file);
        return;
      }

      previewText.textContent = '正在压缩图片...';

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onerror = () => reject(new Error('压缩失败'));
        img.onload = () => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          const longEdge = Math.max(width, height);
          if (longEdge > MAX_COMPRESS_DIM) {
            const k = MAX_COMPRESS_DIM / longEdge;
            width = Math.round(width * k);
            height = Math.round(height * k);
          }

          compressToTargetSize(img, width, height)
            .then(blob => {
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
            })
            .catch(reject);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsDataURL(file);
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
      const selection = cropper.getCropperSelection();
      if (!selection || !selection.width || !selection.height) return;
      // 选框内容异步渲染进正方形预览，切换/销毁后跳过陈旧结果
      selection.$toCanvas().then((canvas) => {
        if (!isCropping || !cropper) return;
        squarePreviewImage.src = canvas.toDataURL();
      }).catch(() => {});
      return;
    }

    squarePreviewImage.src = previewImage.src;
  }
  // #endregion

  // #region 裁切功能
  // Cropper.js v2 模板：整图 contain 居中，选框覆盖全幅且可移动/缩放，设置页锁 1:1
  function buildCropperTemplate() {
    const aspectRatio = location.pathname === '/settings' ? ' aspect-ratio="1"' : '';
    return `<cropper-canvas class="bgm-cropper-canvas" background>
  <cropper-image initial-fit="contain" rotatable scalable translatable></cropper-image>
  <cropper-shade hidden></cropper-shade>
  <cropper-handle action="select" plain></cropper-handle>
  <cropper-selection initial-coverage="1"${aspectRatio} movable resizable zoomable>
    <cropper-grid role="grid" bordered covered></cropper-grid>
    <cropper-crosshair centered></cropper-crosshair>
    <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
    <cropper-handle action="n-resize"></cropper-handle>
    <cropper-handle action="e-resize"></cropper-handle>
    <cropper-handle action="s-resize"></cropper-handle>
    <cropper-handle action="w-resize"></cropper-handle>
    <cropper-handle action="ne-resize"></cropper-handle>
    <cropper-handle action="nw-resize"></cropper-handle>
    <cropper-handle action="se-resize"></cropper-handle>
    <cropper-handle action="sw-resize"></cropper-handle>
  </cropper-selection>
</cropper-canvas>`;
  }

  // 把选框对齐到图片当前变换包围盒的 contain 边界（选框覆盖全幅）
  function syncSelectionToImage() {
    if (!cropper) return;

    const bbox = getImageBBox();
    const canvasEl = cropper.getCropperCanvas();
    const selection = cropper.getCropperSelection();
    if (!bbox || !canvasEl || !selection) return;

    const cw = canvasEl.offsetWidth;
    const ch = canvasEl.offsetHeight;
    const scale = Math.min(cw / bbox[0], ch / bbox[1]);
    const dispW = bbox[0] * scale;
    const dispH = bbox[1] * scale;

    selection.$change((cw - dispW) / 2, (ch - dispH) / 2, dispW, dispH);
  }

  function initCropper() {
    if (cropper) {
      cropper.destroy();
    }

    isCropping = true;
    previewImage.style.display = 'none';
    cropper = Cropper.createCropper(previewImage, { template: buildCropperTemplate() });

    const cropperImage = cropper.getCropperImage();
    const cropperCanvas = cropper.getCropperCanvas();
    const selection = cropper.getCropperSelection();
    if (cropperImage) {
      // v1 的 ready 事件
      cropperImage.$ready(() => {
        syncSelectionToImage();
        positionRotateHandle();
        updateSquarePreview();
      });
    }
    if (cropperCanvas) {
      // v1 的 cropend 事件
      cropperCanvas.addEventListener('actionend', updateSquarePreview);
    }

    // 裁切框上方旋转手柄：拖拽细调任意角度
    if (rotateHandle) {
      rotateHandle.remove();
    }
    if (cropperCanvas && selection) {
      rotateHandle = document.createElement('div');
      rotateHandle.className = 'bgm-rotate-handle';
      rotateHandle.title = '拖动调整旋转角度';
      cropperCanvas.appendChild(rotateHandle);
      bindRotateHandleEvents(rotateHandle);
      selection.addEventListener('change', positionRotateHandle);
    } else {
      rotateHandle = null;
    }

    syncSelectionToImage();
    positionRotateHandle();
    updateSquarePreview();
  }

  function startCropping(e) {
    e.preventDefault();
    if (!currentFile || isMosaicing) return;

    initCropper();
    cropBtn.style.display = 'none';
    mosaicBtn.style.display = 'none';
    rotateLBtn.style.display = 'inline-block';
    rotateRBtn.style.display = 'inline-block';
    cropConfirmBtn.style.display = 'inline-block';
    cropCancelBtn.style.display = 'inline-block';
    previewText.textContent = '调整裁切区域或旋转图片，点击"确认裁切"';
  }

  async function confirmCrop(e) {
    e.preventDefault();
    if (!cropper || !isCropping) return;

    const selection = cropper.getCropperSelection();
    if (!selection || !selection.width || !selection.height) return;

    try {
      // 把选框映射回近似自然分辨率导出，避免按预览尺寸放大失真
      const dims = getExportDims();
      if (!dims) return;
      const canvas = await selection.$toCanvas({ width: dims[0], height: dims[1] });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error('裁切结果导出失败');
      }

      const fileName = currentFile.name.replace(/\.[^/.]+$/, '') + '_cropped.png';
      const croppedFile = new File([blob], fileName, { type: 'image/png' });
      const compressedFile = await compressImage(croppedFile);

      currentFile = compressedFile;

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentFile);
      fileInput.files = dataTransfer.files;

      updatePreview(currentFile);
      endCropping();
    } catch (err) {
      previewText.textContent = `裁切失败：${err.message || err}`;
    }
  }

  function cancelCrop(e) {
    e.preventDefault();
    if (!isCropping) return;
    // 旋转仅作用于预览层（未写回文件），取消即自动放弃旋转与裁切
    updatePreview(currentFile);
    endCropping();
  }

  function endCropping() {
    isCropping = false;
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    rotateHandle = null;
    isRotating = false;
    previewImage.style.display = '';
    showEditButtons();
    rotateLBtn.style.display = 'none';
    rotateRBtn.style.display = 'none';
    cropConfirmBtn.style.display = 'none';
    cropCancelBtn.style.display = 'none';
    updateSquarePreview();
  }
  // #endregion

  // #region 旋转功能
  // 图片经当前变换后在画布坐标系中的轴对齐包围盒（含旋转与缩放）
  function getImageBBox() {
    const cropperImage = cropper && cropper.getCropperImage();
    if (!cropperImage) return null;

    const w0 = previewImage.naturalWidth;
    const h0 = previewImage.naturalHeight;
    if (!w0 || !h0) return null;

    const [a, b, c, d] = cropperImage.$getTransform();
    return [
      Math.abs(a) * w0 + Math.abs(c) * h0,
      Math.abs(b) * w0 + Math.abs(d) * h0,
    ];
  }

  // 选框导出尺寸：按变换缩放分量映射回近似自然分辨率
  function getExportDims() {
    const cropperImage = cropper && cropper.getCropperImage();
    const selection = cropper && cropper.getCropperSelection();
    if (!cropperImage || !selection) return null;

    const [a, b] = cropperImage.$getTransform();
    const scale = Math.hypot(a, b) || 1;
    return [
      Math.round(selection.width / scale),
      Math.round(selection.height / scale),
    ];
  }

  // 旋转手柄跟随选框顶边中点
  function positionRotateHandle() {
    if (!rotateHandle || !cropper) return;

    const selection = cropper.getCropperSelection();
    if (!selection) return;

    rotateHandle.style.transform = `translate(${selection.x + selection.width / 2 - 8}px, ${selection.y - 22}px)`;
  }

  // 拖拽手柄绕画布中心实时旋转（自定义手势，v2 未内置单指针旋转）
  function bindRotateHandleEvents(handle) {
    const angleOf = (event) => Math.atan2(
      event.clientY - rotateCenter.y,
      event.clientX - rotateCenter.x
    );

    handle.addEventListener('pointerdown', (event) => {
      if (isMosaicing || !isCropping || !cropper) return;
      const cropperImage = cropper.getCropperImage();
      if (!cropperImage) return;

      event.preventDefault();
      event.stopPropagation();
      const rect = cropper.getCropperCanvas().getBoundingClientRect();
      rotateCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      rotateLastAngle = angleOf(event);
      isRotating = true;
      handle.classList.add('active');
      handle.setPointerCapture(event.pointerId);
    });

    handle.addEventListener('pointermove', (event) => {
      if (!isRotating || !cropper) return;
      const cropperImage = cropper.getCropperImage();
      if (!cropperImage) return;

      const angle = angleOf(event);
      let delta = angle - rotateLastAngle;
      // 拖过正上方跨越 ±π 时归一化，避免角度跳变
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      rotateLastAngle = angle;
      cropperImage.$rotate(delta);
    });

    const endRotate = () => {
      if (!isRotating) return;
      isRotating = false;
      handle.classList.remove('active');
      updateSquarePreview();
    };
    handle.addEventListener('pointerup', endRotate);
    handle.addEventListener('pointercancel', endRotate);
  }

  // 裁切模式内旋转：v2 旋转是纯 transform 不裁画布，随“确认裁切”经 selection.$toCanvas 一并写回文件
  function handleRotate(e) {
    e.preventDefault();
    if (!currentFile || !isCropping || !cropper) return;

    const cropperImage = cropper.getCropperImage();
    if (!cropperImage) return;

    const deg = e.currentTarget === rotateRBtn ? 90 : -90;
    cropperImage.$rotate(`${deg}deg`);
    cropperImage.$center('contain');
    syncSelectionToImage();
    positionRotateHandle();
    updateSquarePreview();
    previewText.textContent = '已旋转，可继续调整裁切区域或再次旋转';
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

    // JPEG 无 alpha，透明区域会被压成黑底：导出前先垫白底（预览与上传文件保持一致）
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.globalCompositeOperation = 'source-over';

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
        previewText.textContent = '马赛克处理失败';
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
    pendingImage = null;
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
          extraInfo += ' (已转换格式)';
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
      pendingImage = compressedFile;

      // 同步处理结果到文件选择框（upload_photo 等页面直接提交 input 里的文件）
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      fileInput.files = dataTransfer.files;
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

  // #region 新建条目时上传封面（请求处理移植自 bangumi-new-wiki-helper，MIT）
  const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

  function genRandomStr(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < len; i++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
  }

  function insertLoading($sibling) {
    const $loading = document.createElement('div');
    $loading.setAttribute(
      'style',
      'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");'
    );
    $sibling.parentNode.insertBefore($loading, $sibling);
    return $loading;
  }

  function getImgExt(type) {
    return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' })[type] || 'jpg';
  }

  // 以 XHR 提交表单；服务端 302 会被自动跟随，用 xhr.responseURL 拿目标地址。
  // FormData 不会包含未被点击的 submit 按钮，按 helper 的做法手动补回
  function sendBgmForm($form, extraItems = []) {
    return new Promise((resolve, reject) => {
      const fd = new FormData($form);
      extraItems.forEach((item) => {
        if (item.filename) {
          fd.set(item.name, item.value, item.filename);
        } else if (item.value instanceof Blob) {
          fd.set(item.name, item.value);
        } else {
          fd.set(item.name, String(item.value));
        }
      });
      const $submit = $form.querySelector('[name=submit]');
      if ($submit?.name && $submit.value) {
        fd.set($submit.name, $submit.value);
      }
      const method = ($form.getAttribute('method') || 'POST').toUpperCase();
      const xhr = new XMLHttpRequest();
      xhr.open(method, $form.action, true);
      xhr.onload = function () {
        if (xhr.status !== 200) {
          reject(new Error(`请求失败，状态码 ${xhr.status}`));
          return;
        }
        if (!xhr.responseURL) {
          reject(new Error('未获取到返回地址'));
          return;
        }
        resolve(xhr.responseURL);
      };
      xhr.onerror = function () {
        reject(new Error('网络请求失败'));
      };
      xhr.send(fd);
    });
  }

  // 把封面 POST 到 /subject/{id}/upload_img：
  // 1. 页面自带 formhash 时直接组 FormData（formhash + picfile + submit）用 fetch 提交；
  // 2. 否则抓上传页 HTML，解析 form[name=img_upload]（含 formhash）后用 XHR 提交。
  // 成功时服务端 302，fetch/XHR 自动跟随
  async function uploadSubjectCover(subjectId, file) {
    const filename = `${genRandomStr(5)}.${getImgExt(file.type)}`;
    const $hash = document.querySelector('form > input[name="formhash"]');
    if ($hash) {
      const fd = new FormData();
      fd.set('formhash', $hash.value);
      fd.set('picfile', file, filename);
      fd.set('submit', '上传图片');
      await fetch(`/subject/${subjectId}/upload_img`, { method: 'post', body: fd });
      return;
    }
    const res = await fetch(`/subject/${subjectId}/upload_img`);
    const rawText = await res.text();
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const $form = $doc.querySelector('form[name=img_upload]');
    if (!$form) {
      throw new Error('上传页未找到 img_upload 表单');
    }
    const $fileInput = $form.querySelector('input[type=file]');
    await sendBgmForm($form, [
      { name: $fileInput?.name || 'picfile', value: file, filename },
    ]);
  }

  // 带图时接管创建提交：先创建条目拿到新 id，再上传封面
  async function handleCreateSubmit($form) {
    const file = pendingImage;
    if (!file) return;

    const $submit = $form.querySelector('[name=submit]');
    const $loading = $submit ? insertLoading($submit) : null;
    previewText.textContent = '正在创建条目…';
    previewWrapper.style.display = 'flex';
    try {
      if ($submit) $submit.disabled = true;
      // helper 在提交前会点「wiki 模式」，把新手模式的表单字段同步进 wcode 编辑框
      const $wikiMode = document.querySelector(
        'table small a:nth-of-type(1)[href="javascript:void(0)"]'
      );
      if ($wikiMode) $wikiMode.click();
      await sleep(200);

      const url = await sendBgmForm($form);
      const match = url.match(/subject\/(\d+)/);
      if (!match) {
        throw new Error(`未从返回地址解析出条目 id：${url}`);
      }
      const subjectId = match[1];
      console.log('wikiUploadPic: 条目已创建', url);

      previewText.textContent = `条目已创建（${subjectId}），正在上传封面…`;
      try {
        await uploadSubjectCover(subjectId, file);
        previewText.textContent = '封面已上传，正在跳转…';
      } catch (coverErr) {
        console.error('wikiUploadPic 上传封面失败:', coverErr);
        previewText.textContent = `封面上传失败：${coverErr.message || coverErr}，稍后跳转…`;
        await sleep(1500);
      }
      location.assign(url);
    } catch (err) {
      console.error('wikiUploadPic 创建条目失败:', err);
      previewText.textContent = `创建条目失败：${err.message || err}`;
      if ($submit) $submit.disabled = false;
      if ($loading) $loading.remove();
    }
  }

  // 有图时拦截表单提交走两步请求；无图时放行原提交，行为与未装脚本一致
  if (isNewSubjectPage && createForm) {
    createForm.addEventListener('submit', function (e) {
      if (!pendingImage) return;
      e.preventDefault();
      handleCreateSubmit(createForm);
    });

    // 接收 wikiImportNDL / wikiImportBookoff 投递的封面 img（src 为 dataURL）
    function consumeImportedCover() {
      const $cover = document.querySelector('img[data-bgm-import-cover]');
      if (!$cover) return false;
      const dataUrl = $cover.getAttribute('src') || '';
      const fromImport = dataUrl.startsWith('data:');
      $cover.remove();
      if (!fromImport) return false;
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            `import-${Date.now()}.${getImgExt(blob.type)}`,
            { type: blob.type || 'image/jpeg' }
          );
          // 同步到注入的文件选择框：让输入框显示已选文件而非「未选择文件」；
          // input 无 name，不会被序列化进创建请求，实际上传仍走 pendingImage
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          previewText.textContent = '检测到导入封面，处理中…';
          return updatePreview(file);
        })
        .then((ok) => {
          if (ok === false) {
            previewText.textContent = '导入封面处理失败';
          }
        })
        .catch((err) => {
          console.error('导入封面处理失败:', err);
          previewText.textContent = `导入封面处理失败：${err.message || err}`;
        });
      return true;
    }

    // 监听 DOM，出现导入封面元素即接管消费
    const coverObserver = new MutationObserver(() => {
      if (consumeImportedCover()) {
        coverObserver.disconnect();
      }
    });
    coverObserver.observe(document.body, { childList: true, subtree: true });
    // 导入脚本可能先于本脚本注入封面（observer 只能看到注册之后的变化），先扫一次
    consumeImportedCover();
  }
  // #endregion

  // #region 事件监听
  // 裁切相关事件
  cropBtn.addEventListener('click', startCropping);
  cropConfirmBtn.addEventListener('click', confirmCrop);
  cropCancelBtn.addEventListener('click', cancelCrop);

  // 旋转按钮事件
  rotateLBtn.addEventListener('click', handleRotate);
  rotateRBtn.addEventListener('click', handleRotate);

  // 清除按钮事件
  clearBtn.addEventListener('click', clearPendingImage);

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

  // 全局拖拽：拖入图片文件/图片 URL 即导入；带文件的拖拽必须拦截默认行为，
  // 否则浏览器会直接打开文件、丢掉已填写的表单
  const dragHasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  const isEditableTarget = (e) => {
    const el = e.target;
    return el instanceof Element && el.closest('textarea, input, [contenteditable]');
  };
  const dragImageUrl = (e) => {
    if (!e.dataTransfer) return '';
    // uri-list 可能带 # 注释行
    const url = (e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain') || '')
      .split('\n').filter((line) => line && !line.startsWith('#'))[0] || '';
    return url && isImageUrl(url) ? url : '';
  };

  document.addEventListener('dragover', function (e) {
    if (dragHasFiles(e)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      return;
    }
    // 非文件拖拽（多是文本/图片链接）：仅放行拖向输入框的文本，其余拦截防页面跳转
    if (!isEditableTarget(e)) e.preventDefault();
  });

  document.addEventListener('drop', async function (e) {
    if (dragHasFiles(e)) {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        previewText.textContent = '读取拖入的图片...';
        previewWrapper.style.display = 'flex';
        const ok = await updatePreview(file);
        if (ok !== false) {
          // 与粘贴/URL 下载一致：把处理完成的文件同步回输入框
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(currentFile || file);
          fileInput.files = dataTransfer.files;
        }
      } else {
        previewText.textContent = '拖入的不是图片文件';
        previewWrapper.style.display = 'flex';
      }
      return;
    }

    // 图片 URL 拖入（如从其他网页拖动图片）；非编辑目标一律拦截默认行为
    if (isEditableTarget(e)) return;
    e.preventDefault();
    const url = dragImageUrl(e);
    if (!url) return;
    try {
      const imageFile = await fetchImageFromUrl(url);
      if (imageFile) {
        await updatePreview(imageFile);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(currentFile || imageFile);
        fileInput.files = dataTransfer.files;
      }
    } catch (err) {
      previewText.textContent = err.message || '图片下载失败';
      previewWrapper.style.display = 'flex';
    }
  });

  // 添加提示信息
  const hint = document.createElement('div');
  hint.className = 'bgm-hint';
  hint.textContent = isNewSubjectPage
    ? '提示：选好、粘贴或拖入图片后，点原页面的创建按钮，脚本会先创建条目再自动上传封面'
    : '提示：点击按钮获取剪贴板内容，或直接按 Ctrl+V 粘贴，也可拖入图片';
  const hintAnchor = isNewSubjectPage ? getClipboardBtn : fileInput;
  hintAnchor.parentNode.insertBefore(hint, hintAnchor.nextSibling);
// #endregion
})();
