attribute vec2 a_pos;
attribute float a_id;
attribute float a_type;
attribute float a_texIndex;

uniform float u_time;
uniform vec2 u_res;
uniform float u_snow_min;
uniform float u_snow_max;
uniform float u_emoji_min;
uniform float u_emoji_max;
uniform float u_rot_speed;
uniform float u_fall_speed;

varying vec2 v_uv;
varying float v_type;
varying float v_rot;
varying float v_texIndex;

float rand(float n) {
    return fract(sin(n) * 43758.5453123);
}

void main() {
    float id = floor(a_id);
    float type = a_type;

    float x = rand(id * 1.3) * u_res.x;

    float speed = mix(20.0, 60.0, rand(id)) * u_fall_speed;

    float spawnWindow = u_res.y / speed;
    float birthTime = rand(id * 7.13) * spawnWindow;

    float t = u_time - birthTime;

    if (t < 0.0) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
        return;
    }

    float y = t * speed;
    y = mod(y, u_res.y + 100.0);

    float radius = type < 0.5
        ? mix(u_snow_min, u_snow_max, rand(id * 3.14))
        : mix(u_emoji_min, u_emoji_max, rand(id * 3.14));

    float rot = rand(id) * 6.28318 + u_time * u_rot_speed;

    vec2 offset = a_pos * radius;
    float c = cos(rot), s = sin(rot);
    vec2 rotated = vec2(
        offset.x * c - offset.y * s,
        offset.x * s + offset.y * c
    );

    vec2 pos = vec2(x, y) + rotated;
    vec2 clip = pos / u_res * 2.0 - 1.0;
    clip.y *= -1.0;

    gl_Position = vec4(clip, 0.0, 1.0);

    v_uv = a_pos * 0.5 + 0.5;
    v_type = type;
    v_rot = rot;
    v_texIndex = a_texIndex;
}