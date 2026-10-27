/**
 * 路径家族 · 四张新卡（2026-10-27 新增）
 *
 * **为什么加这一族**：现有 20 张卡里**没有「路径 / 岔路 / 收敛 / 阶梯」这类形状** ——
 * 讲「我当初挑了一条路，一路走下来」「当初有两条路，我选了这条」「理由越来越讲不出来」
 * 「越走越顺」这类内容时，只能退化成「把口播逐字排成大字」。
 *
 * **四张卡**
 *   · `path-track`  一条路    —— 横向基线 + 沿途节点，节点逐个亮起（走过来的顺序）
 *   · `path-fork`   岔路      —— 一条主线分两枝（我挑的 / 没挑的）
 *   · `path-funnel` 收敛      —— 多条进线汇成一条出线（理由讲不出来了）
 *   · `path-stair`  阶梯      —— 逐级升高的台阶（越用越顺）
 *
 * **与上游精修版卡的关系**：上游 19 张卡是「逐拍照搬隔离 Opus 一次性作品」的精修版；
 * 本族是**新写的**，走的是同一套约定（画面是 t 的纯函数 / 只用行内样式 / 不吃 hud.css），
 * 但动效是**自洽的新设计**，不是移植 —— 所以不逐帧照搬，也没有参考作品可搬。
 *
 * **竖屏优先**：本账号是 9:16（1080×1920），路径类形状天然适合竖屏；
 * 横屏下同样可用（一路横排）。
 */
import { STAGE, isPortrait } from "../../stage";
import type { CSSProperties } from "react";
import { useId } from "react";
import type { EffectDef, EffectProps } from "../types";
import { useCardElapsed } from "./useTimelineTime";
import {
  ACCENT_OPTIONS,
  ACCENT_SWATCH,
  OFFSET_CONTROLS,
  OFFSET_DEFAULTS,
  offsetVars,
  THEME_OPTIONS,
} from "./accent";

/* ══════════════════════════════════════════════════════════════════════
   共用工具
   ══════════════════════════════════════════════════════════════════════ */

const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** 进度：先比端点（b 是 Infinity 时直接相除会得 NaN） */
const prog = (t: number, a: number, b: number) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const eOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
/** 阻尼弹簧（闭式解，t 单位秒） */
function spring(t: number, w = 9, z = 0.55) {
  if (t <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}


/** 竖屏：内容安全区 x 64–1000；横屏：左右分列时避开人脸 */
const contentLeft = () => (isPortrait() ? 64 : 0);
const contentW = () => (isPortrait() ? STAGE.w - 128 : STAGE.w - 240);

/** 卡片通用外壳参数 */
interface PathBase {
  theme: "dark" | "light";
  position: "center" | "left" | "right";
  offsetX?: number;
  offsetY?: number;
}

const themeVars = (theme: "dark" | "light"): CSSProperties =>
  theme === "dark"
    ? ({
        "--hud-panel": "rgba(14,16,20,0.92)",
        "--hud-ink": "#f2f4f7",
        "--hud-muted": "rgba(242,244,247,0.68)",
        "--hud-faint": "rgba(242,244,247,0.40)",
        "--hud-line": "rgba(255,255,255,0.14)",
      } as CSSProperties)
    : ({
        "--hud-panel": "rgba(250,248,243,0.94)",
        "--hud-ink": "#14161a",
        "--hud-muted": "rgba(20,22,26,0.66)",
        "--hud-faint": "rgba(20,22,26,0.38)",
        "--hud-line": "rgba(20,22,26,0.14)",
      } as CSSProperties);

/* ══════════════════════════════════════════════════════════════════════
   ① path-track · 一条路
   ══════════════════════════════════════════════════════════════════════ */

export interface PathTrackParams extends PathBase {
  /** 沿途节点，一行一个（| 分隔也行） */
  nodes: string;
  /** 小标题 */
  title: string;
  /** 节点之间的间隔(ms) */
  stepMs: number;
  /** 强调色 */
  accent: string;
  /** 节点标签字号 */
  labelSize: number;
}

function PathTrack({ params, playToken }: EffectProps<PathTrackParams>) {
  const p = params as PathTrackParams & { __t?: number; __start?: number; __end?: number };
  const t = useCardElapsed(p, playToken);
  const uid = useId().replace(/:/g, "");
  const acc = ACCENT_SWATCH[params.accent] ?? ACCENT_SWATCH.blue;
  const nodes = params.nodes
    .split(/[|\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const n = nodes.length || 1;

  const W = Math.min(contentW(), isPortrait() ? 880 : 900);
  const FS = params.labelSize || 30;
  const step = (params.stepMs ?? 420) / 1000;
  const T_LINE = 1.1;

  // 基线从左往右生长；节点在基线之后逐个弹起
  const lineK = eOutCubic(prog(t, 0.15, 0.15 + T_LINE));

  const cx = STAGE.w / 2;
  const top = Math.round(STAGE.h * 0.36) + (params.offsetY ?? 0);
  const dotY = top + 26;

  return (
    <div
      data-card-theme={params.theme}
      style={{
        ...themeVars(params.theme),
        ...offsetVars(params),
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      {params.title ? (
        <div
          style={{
            position: "absolute",
            left: contentLeft(),
            right: contentLeft(),
            top: top - 84,
            textAlign: "center",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 2,
            color: "var(--hud-muted)",
            opacity: eOutCubic(prog(t, 0, 0.5)),
          }}
        >
          {params.title}
        </div>
      ) : null}

      {/* 基线 */}
      <div
        style={{
          position: "absolute",
          left: cx - W / 2,
          top: dotY - 2,
          width: W * lineK,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${acc} 0%, ${acc} 70%, var(--hud-line) 100%)`,
        }}
      />

      {/* 节点 */}
      {nodes.map((label, i) => {
        const t0 = 0.55 + i * step;
        const k = spring(Math.max(0, t - t0), 11, 0.5);
        const x = cx - W / 2 + (W / (n - 1 || 1)) * i;
        const isLast = i === n - 1;
        return (
          <div key={`${uid}-${i}`}>
            {/* 节点圆点 */}
            <div
              style={{
                position: "absolute",
                left: x - 15,
                top: dotY - 15,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: isLast ? acc : "var(--hud-panel)",
                border: `3px solid ${acc}`,
                boxShadow: `0 0 ${18 * k}px ${acc}66`,
                transform: `scale(${clamp(k, 0, 1.25)})`,
                opacity: clamp(k * 2, 0, 1),
              }}
            />
            {/* 标签 */}
            <div
              style={{
                position: "absolute",
                left: x - 120,
                width: 240,
                top: dotY + 34,
                textAlign: "center",
                fontSize: FS,
                fontWeight: 700,
                lineHeight: 1.3,
                color: isLast ? acc : "var(--hud-ink)",
                opacity: clamp(prog(t, t0 + 0.06, t0 + 0.42), 0, 1),
                transform: `translateY(${(1 - eOutCubic(prog(t, t0 + 0.06, t0 + 0.42))) * 16}px)`,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const pathTrackDef: EffectDef<PathTrackParams> = {
  id: "path-track",
  name: "PathTrack",
  description: "一条路 · 沿途节点逐个亮起（走过来的顺序）",
  tags: ["逐条落位", "生长描画"],
  selfPosition: true,
  defaults: {
    theme: "dark",
    position: "center",
    title: "一条路",
    nodes: "当初挑它|越用越顺|再没换过",
    stepMs: 420,
    accent: "blue",
    labelSize: 30,
    ...OFFSET_DEFAULTS,
  },
  controls: [
    { key: "theme", label: "底色(此卡独立生效)", type: "select", options: THEME_OPTIONS },
    {
      key: "position",
      label: "落位",
      type: "select",
      options: [
        { label: "居中", value: "center" },
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
      ],
    },
    { key: "title", label: "小标题", type: "text" },
    { key: "nodes", label: "沿途节点(| 分隔,最多 6 个)", type: "textarea", rows: 3 },
    { key: "stepMs", label: "节点间隔", type: "range", min: 150, max: 1500, step: 50, unit: "ms" },
    { key: "accent", label: "强调色", type: "select", options: ACCENT_OPTIONS },
    { key: "labelSize", label: "节点字号", type: "range", min: 20, max: 44, step: 2, unit: "px" },
    ...OFFSET_CONTROLS,
  ],
  Component: PathTrack,
};

/* ══════════════════════════════════════════════════════════════════════
   ② path-fork · 岔路
   ══════════════════════════════════════════════════════════════════════ */

export interface PathForkParams extends PathBase {
  /** 两条分支的标签（| 分隔，最多 2 条） */
  branches: string;
  /** 起点标签（主干上的那件事） */
  origin: string;
  /** 强调色 */
  accent: string;
  /** 分支字号 */
  labelSize: number;
}

function PathFork({ params, playToken }: EffectProps<PathForkParams>) {
  const p = params as PathForkParams & { __t?: number; __start?: number };
  const t = useCardElapsed(p, playToken);
  const uid = useId().replace(/:/g, "");
  const acc = ACCENT_SWATCH[params.accent] ?? ACCENT_SWATCH.blue;
  const br = params.branches
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  const [a, b] = [br[0] ?? "我挑的这条", br[1] ?? "没挑的那条"];

  const FS = params.labelSize || 34;
  const cx = STAGE.w / 2;
  const top = Math.round(STAGE.h * 0.34) + (params.offsetY ?? 0);

  // 主干 → 两枝：主干先画（0.2–0.8s），两枝随后错峰生长
  const trunkK = eOutCubic(prog(t, 0.2, 0.8));
  const brK = [spring(Math.max(0, t - 0.75), 10, 0.55), spring(Math.max(0, t - 1.05), 10, 0.55)];

  const rowGap = 150;

  return (
    <div
      data-card-theme={params.theme}
      style={{
        ...themeVars(params.theme),
        ...offsetVars(params),
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      {/* 起点 */}
      <div
        style={{
          position: "absolute",
          left: cx - 200,
          width: 400,
          top,
          textAlign: "center",
          fontSize: FS,
          fontWeight: 700,
          color: "var(--hud-ink)",
          opacity: eOutCubic(prog(t, 0, 0.45)),
        }}
      >
        {params.origin || "当初那件事"}
      </div>

      {/* 主干（起点 → 分叉点，竖直向下） */}
      <div
        style={{
          position: "absolute",
          left: cx - 2,
          top: top + FS * 1.3,
          width: 4,
          height: 96 * trunkK,
          borderRadius: 2,
          background: "var(--hud-line)",
        }}
      />
      {/* 主干末端分叉点 */}
      <div
        style={{
          position: "absolute",
          left: cx - 7,
          top: top + FS * 1.3 + 96,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: acc,
          opacity: trunkK,
        }}
      />

      {/* 两条分支
       * ⚠️ 2026-10-27 实测修：分支 0 的标签原来在 `top - 26`，而**起点标签在 `top`** ——
       *   两者只差 26px，字号 28+ 时必然重叠（成片抽帧 133s 实测糊在一起）。
       *   现在改成**竖向主干**：起点在 `top` → 主干竖直向下 → 分叉点在 `top + 字号×1.3 + 96`
       *   → 两枝从分叉点向左下 / 右下展开 → 标签在分叉点下方 40px 与 40+rowGap。
       *   这样「起点 / 主干 / 分叉点 / 两枝标签」**四层各占一段，互不重叠**。 */}
      {[
        { label: a, y: top + FS * 1.3 + 96 + 56, k: brK[0], color: acc },
        { label: b, y: top + FS * 1.3 + 96 + 56 + rowGap, k: brK[1], color: "var(--hud-muted)" },
      ].map((br2, i) => (
        <div key={`${uid}-${i}`}>
          {/* 分枝线：从分叉点斜向两边 */}
          <svg
            style={{
              position: "absolute",
              left: cx - 260,
              top: top + FS * 1.3 + 96,
              width: 520,
              height: rowGap + 80,
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <path
              d={`M 260 0 C 260 0, ${i === 0 ? 160 : 360} ${i === 0 ? 20 : rowGap}, ${i === 0 ? 60 : 460} ${i === 0 ? 24 : rowGap + 4}`}
              fill="none"
              stroke={br2.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={900}
              strokeDashoffset={900 * (1 - clamp(br2.k))}
              opacity={clamp(br2.k * 2, 0, 1)}
            />
          </svg>
          {/* 分支标签 */}
          <div
            style={{
              position: "absolute",
              left: i === 0 ? cx - 470 : cx + 70,
              width: 400,
              top: br2.y,
              textAlign: i === 0 ? "right" : "left",
              fontSize: FS,
              fontWeight: 700,
              lineHeight: 1.3,
              color: br2.color,
              opacity: clamp(prog(t, i === 0 ? 0.9 : 1.2, (i === 0 ? 0.9 : 1.2) + 0.4), 0, 1),
              transform: `translateX(${(1 - eOutCubic(prog(t, i === 0 ? 0.9 : 1.2, (i === 0 ? 0.9 : 1.2) + 0.4))) * (i === 0 ? -20 : 20)}px)`,
            }}
          >
            {br2.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export const pathForkDef: EffectDef<PathForkParams> = {
  id: "path-fork",
  name: "PathFork",
  description: "岔路 · 一条主线分成两枝（我挑的 / 没挑的）",
  tags: ["对撞并置", "生长描画"],
  selfPosition: true,
  defaults: {
    theme: "dark",
    position: "center",
    origin: "当初那件事",
    branches: "我挑的这条|没挑的那条",
    accent: "blue",
    labelSize: 34,
    ...OFFSET_DEFAULTS,
  },
  controls: [
    { key: "theme", label: "底色(此卡独立生效)", type: "select", options: THEME_OPTIONS },
    {
      key: "position",
      label: "落位",
      type: "select",
      options: [
        { label: "居中", value: "center" },
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
      ],
    },
    { key: "origin", label: "起点标签", type: "text" },
    { key: "branches", label: "两条分支(| 分隔)", type: "text" },
    { key: "accent", label: "强调色(选中的那条)", type: "select", options: ACCENT_OPTIONS },
    { key: "labelSize", label: "标签字号", type: "range", min: 22, max: 48, step: 2, unit: "px" },
    ...OFFSET_CONTROLS,
  ],
  Component: PathFork,
};

/* ══════════════════════════════════════════════════════════════════════
   ③ path-funnel · 收敛
   ══════════════════════════════════════════════════════════════════════ */

export interface PathFunnelParams extends PathBase {
  /** 左侧进线（一行一个） */
  ins: string;
  /** 右侧出线上的文字 */
  out: string;
  /** 强调色（出线） */
  accent: string;
  /** 进线字号 */
  labelSize: number;
}

function PathFunnel({ params, playToken }: EffectProps<PathFunnelParams>) {
  const p = params as PathFunnelParams & { __t?: number; __start?: number };
  const t = useCardElapsed(p, playToken);
  const uid = useId().replace(/:/g, "");
  const acc = ACCENT_SWATCH[params.accent] ?? ACCENT_SWATCH.blue;
  const ins = params.ins
    .split(/[|\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  const n = ins.length || 1;

  const FS = params.labelSize || 28;
  const rowH = 74;
  const leftW = Math.min(contentW() * 0.44, 420);
  const top = Math.round(STAGE.h * 0.34) + (params.offsetY ?? 0);
  const groupH = rowH * n;

  // 进线逐条出现（0.4 + i*0.28），出线最后才接上（1.6s）
  const neckK = eOutCubic(prog(t, 1.55, 2.15));

  return (
    <div
      data-card-theme={params.theme}
      style={{
        ...themeVars(params.theme),
        ...offsetVars(params),
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      {/* 进线 */}
      {ins.map((label, i) => {
        const t0 = 0.4 + i * 0.28;
        const k = eOutCubic(prog(t, t0, t0 + 0.45));
        const y = top + i * rowH;
        return (
          <div key={`${uid}-${i}`}>
            <div
              style={{
                position: "absolute",
                left: contentLeft(),
                top: y,
                width: leftW,
                display: "flex",
                alignItems: "center",
                gap: 14,
                opacity: k,
                transform: `translateX(${(1 - k) * -26}px)`,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--hud-faint)",
                  flex: "0 0 auto",
                }}
              />
              <div
                style={{
                  fontSize: FS,
                  fontWeight: 600,
                  color: "var(--hud-ink)",
                  lineHeight: 1.3,
                }}
              >
                {label}
              </div>
            </div>
            {/* 进线到收敛口的连线 */}
            <svg
              style={{
                position: "absolute",
                left: contentLeft() + leftW,
                top: y - 2,
                width: 260,
                height: groupH + 20,
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              <path
                d={`M 0 8 C 90 8, 150 ${groupH / 2}, 250 ${groupH / 2 + 8}`}
                fill="none"
                stroke="var(--hud-line)"
                strokeWidth={3}
                strokeDasharray={700}
                strokeDashoffset={700 * (1 - k)}
                opacity={k * 0.9}
              />
            </svg>
          </div>
        );
      })}

      {/* 收敛口 */}
      <div
        style={{
          position: "absolute",
          left: contentLeft() + leftW + 250,
          top: top + groupH / 2 - 8,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: acc,
          boxShadow: `0 0 ${22 * neckK}px ${acc}88`,
          opacity: neckK,
        }}
      />

      {/* 出线 */}
      <div
        style={{
          position: "absolute",
          left: contentLeft() + leftW + 266,
          top: top + groupH / 2,
          width: 180,
          fontSize: FS + 6,
          fontWeight: 800,
          lineHeight: 1.3,
          color: acc,
          opacity: clamp(prog(t, 2.05, 2.55), 0, 1),
          transform: `translateX(${(1 - eOutCubic(prog(t, 2.05, 2.55))) * 22}px)`,
        }}
      >
        {params.out || "现在讲不出来"}
      </div>
    </div>
  );
}

export const pathFunnelDef: EffectDef<PathFunnelParams> = {
  id: "path-funnel",
  name: "PathFunnel",
  description: "收敛 · 多条进线汇成一条出线（理由讲不出来了）",
  tags: ["聚散飞行", "生长描画"],
  selfPosition: true,
  defaults: {
    theme: "dark",
    position: "center",
    ins: "当时有理由|场景也一样|没人提醒",
    out: "现在讲不出来",
    accent: "orange",
    labelSize: 28,
    ...OFFSET_DEFAULTS,
  },
  controls: [
    { key: "theme", label: "底色(此卡独立生效)", type: "select", options: THEME_OPTIONS },
    {
      key: "position",
      label: "落位",
      type: "select",
      options: [
        { label: "居中", value: "center" },
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
      ],
    },
    { key: "ins", label: "左侧进线(| 分隔,最多 5 条)", type: "textarea", rows: 4 },
    { key: "out", label: "出线上的字", type: "text" },
    { key: "accent", label: "强调色(出线)", type: "select", options: ACCENT_OPTIONS },
    { key: "labelSize", label: "进线字号", type: "range", min: 20, max: 40, step: 2, unit: "px" },
    ...OFFSET_CONTROLS,
  ],
  Component: PathFunnel,
};

/* ══════════════════════════════════════════════════════════════════════
   ④ path-stair · 阶梯
   ══════════════════════════════════════════════════════════════════════ */

export interface PathStairParams extends PathBase {
  /** 每一级台阶的标签（| 分隔） */
  steps: string;
  /** 强调色 */
  accent: string;
  /** 标签字号 */
  labelSize: number;
}

function PathStair({ params, playToken }: EffectProps<PathStairParams>) {
  const p = params as PathStairParams & { __t?: number; __start?: number };
  const t = useCardElapsed(p, playToken);
  const uid = useId().replace(/:/g, "");
  const acc = ACCENT_SWATCH[params.accent] ?? ACCENT_SWATCH.blue;
  const steps = params.steps
    .split(/[|\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  const n = steps.length || 1;

  const FS = params.labelSize || 30;
  const rowH = 96;
  const W = Math.min(contentW(), isPortrait() ? 840 : 760);
  const cx = STAGE.w / 2;
  const top = Math.round(STAGE.h * 0.3) + (params.offsetY ?? 0);

  return (
    <div
      data-card-theme={params.theme}
      style={{
        ...themeVars(params.theme),
        ...offsetVars(params),
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      {steps.map((label, i) => {
        const t0 = 0.35 + i * 0.42;
        const k = spring(Math.max(0, t - t0), 10, 0.5);
        // 每级比上一级矮一点 → 台阶向上；但从左往右错开
        const barH = 54 - i * 4;
        const barW = 120 + i * 90;
        const y = top + (n - 1 - i) * rowH;
        return (
          <div key={`${uid}-${i}`}>
            {/* 台阶块 */}
            <div
              style={{
                position: "absolute",
                left: cx - W / 2,
                top: y,
                width: barW * clamp(k, 0, 1.2),
                height: barH,
                borderRadius: 6,
                background: `linear-gradient(90deg, ${acc} 0%, ${acc}cc 100%)`,
                opacity: clamp(k * 2, 0, 1),
                transform: `translateY(${(1 - eOutCubic(clamp(k))) * 18}px)`,
              }}
            />
            {/* 台阶标签 */}
            <div
              style={{
                position: "absolute",
                left: cx - W / 2 + barW + 20,
                width: 400,
                top: y + barH / 2 - FS * 0.72,
                fontSize: FS,
                fontWeight: 700,
                lineHeight: 1.3,
                color: "var(--hud-ink)",
                opacity: clamp(prog(t, t0 + 0.08, t0 + 0.42), 0, 1),
                transform: `translateX(${(1 - eOutCubic(prog(t, t0 + 0.08, t0 + 0.42))) * 18}px)`,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const pathStairDef: EffectDef<PathStairParams> = {
  id: "path-stair",
  name: "PathStair",
  description: "阶梯 · 逐级升高（越用越顺）",
  tags: ["逐条落位"],
  selfPosition: true,
  defaults: {
    theme: "dark",
    position: "center",
    steps: "第 1 次|第 2 次|第 3 次|越用越省事",
    accent: "blue",
    labelSize: 30,
    ...OFFSET_DEFAULTS,
  },
  controls: [
    { key: "theme", label: "底色(此卡独立生效)", type: "select", options: THEME_OPTIONS },
    {
      key: "position",
      label: "落位",
      type: "select",
      options: [
        { label: "居中", value: "center" },
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
      ],
    },
    { key: "steps", label: "每一级的标签(| 分隔,最多 5 级)", type: "textarea", rows: 4 },
    { key: "accent", label: "强调色", type: "select", options: ACCENT_OPTIONS },
    { key: "labelSize", label: "标签字号", type: "range", min: 20, max: 44, step: 2, unit: "px" },
    ...OFFSET_CONTROLS,
  ],
  Component: PathStair,
};
