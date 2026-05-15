precision mediump float;
uniform sampler2D u_tex;
uniform float u_cols;

varying vec2 v_uv;
varying float v_type;
varying float v_rot;
varying float v_texIndex;

void main() {
    if ( v_type < 0.5 ) {
        vec2 p = v_uv - 0.5;
        float alpha = smoothstep(0.5, 0.0, length(p));
        if( alpha < 0.01 ) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        return;
    }

    float col = v_texIndex;
    vec2 uv = v_uv;
    uv.x = (uv.x + col) / u_cols;
    vec4 color = texture2D(u_tex, uv);
    if (color.a < 0.1) discard;
    gl_FragColor = color;
}