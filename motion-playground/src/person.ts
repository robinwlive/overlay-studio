/** 人物出镜模式 · 单一开关的判定与无人物构图规则
 *
 *  有人出镜(overlay 用法):导出的动效层是**透明**的,拖进剪映盖在原始口播上。
 *  无人物(默认):画面没有主体,导出的是**黑底成片**,卡片按「占中间」重排。
 *
 *  UI 上的开关、画布上的构图、导出脚本的底色,全部只读这一个字段(doc.person),
 *  免得"开关说没人、导出的却是透明层"这种对不上的情况。
 */
import type { OverlayCard } from "./overlay/types";

/** doc.person === true 才是有人物;缺省/未写一律按无人物处理(默认黑底) */
export function isPerson(doc: { person?: boolean } | null | undefined): boolean {
  return doc?.person === true;
}

/** 落位取值里属于「靠一侧」的那几个 —— 有人物时它们要绕开人脸,无人物时该收到中间 */
const SIDE_LEFT = new Set(["left", "top-left"]);
const SIDE_RIGHT = new Set(["right", "top-right"]);

function sideOf(p: Record<string, unknown>): "l" | "r" | null {
  const v = (p.side ?? p.position) as string | undefined;
  if (typeof v !== "string") return null;
  if (SIDE_LEFT.has(v)) return "l";
  if (SIDE_RIGHT.has(v)) return "r";
  return null;
}

/** 无人物构图计划:哪张卡可以真居中,哪张卡只把盒子挪到中线
 *
 *  规则只有两条,都是为了不跟编排打架:
 *
 *  1. **成对的卡不动。** 同一时刻左侧一张、右侧一张,这是作者有意的左右分列;
 *     把两张都收中会让它们叠在一起。只收「孤零零站在一侧」的卡。
 *  2. **能真居中就真居中。** 卡片自己提供 center 落位、且当时没和对面成对时,
 *     交给渲染层把 position 改成 center —— 卡宽、字号、进场方向都跟着算成居中版,
 *     这才是"饱满";没有 center 选项的卡退一步,只把盒子挪到中线(noperson.css)。
 *
 *  用户手动选过左/右的也尊重:只有仍等于卡片默认落位的卡才参与重排。
 *  返回空集合 = 这张编排不需要重排;渲染层照常逐卡判断,不影响有人物模式。
 */
export function nopersonPlan(
  cards: readonly OverlayCard[],
  defs: readonly {
    id: string;
    defaults?: Record<string, unknown>;
    controls?: readonly { key?: string; options?: readonly { value?: string }[] }[];
  }[],
): { center: Set<string>; box: Set<string> } {
  const center = new Set<string>();
  const box = new Set<string>();
  if (!cards.length) return { center, box };

  const overlaps = (a: OverlayCard, b: OverlayCard) => a.start < b.end && b.start < a.end;
  const oppositeSide = (a: OverlayCard) =>
    cards.some((b) => b.id !== a.id && overlaps(a, b) && sideOf(b.params) !== null && sideOf(b.params) !== sideOf(a.params));

  for (const card of cards) {
    const side = sideOf(card.params);
    if (!side) continue; // 本来就是居中/底部卡:不动
    if (oppositeSide(card)) continue; // 左右成对:保持分列
    const def = defs.find((d) => d.id === card.kind);
    const key = card.params.side != null ? "side" : "position";
    const cur = card.params[key] as string;
    if (def?.defaults?.[key] !== cur) continue; // 用户自己挑的落位,尊重
    const values = (def?.controls?.find((c) => c.key === key)?.options ?? []).map((o) => o.value);
    if (values.includes("center")) center.add(card.id);
    else box.add(card.id);
  }
  return { center, box };
}

/** 单卡场景(效果库预览)的重排:没有"成对"可言,直接按卡自己的落位判断 */
export function nopersonSingle(
  params: Record<string, unknown>,
  def:
    | {
        defaults?: Record<string, unknown>;
        controls?: readonly { key?: string; options?: readonly { value?: string }[] }[];
      }
    | undefined,
): { params: Record<string, unknown>; box: boolean } {
  const side = sideOf(params);
  if (!side) return { params, box: false };
  const key = params.side != null ? "side" : "position";
  if (def?.defaults?.[key] !== params[key]) return { params, box: false }; // 用户挑过的落位
  const values = (def?.controls?.find((c) => c.key === key)?.options ?? []).map((o) => o.value);
  if (values.includes("center")) return { params: { ...params, [key]: "center" }, box: false };
  return { params, box: true };
}

/** 无人物模式下,「单独出现、已经收到中间」的卡放大一档 —— 画面没有主体,内容可以更满。
 *  只作用在居中/收中线的卡上:左右成对分列的卡不放大,否则两边会撞在一起。 */
export const NOPERSON_BOOST = 1.12;

/** 竖屏(9:16)时内容卡的额外放大。
 *  卡片的字号和内边距都是按 1920 宽的横屏定的绝对像素,搬到 1080 宽的竖屏上,
 *  同样的 px 占画面的比例更小 —— 结果就是卡片看着"缩在中间",上下全是空。
 *  竖屏补偿 1.3 倍,卡片才把 1080 的宽度用起来。 */
export const PORTRAIT_BOOST = 1.3;

/** 字幕层在竖屏要更大(44px 在 1080 宽偏小),但不能跟内容卡一个量级 */
export const PORTRAIT_CAPTION_BOOST = 1.15;
