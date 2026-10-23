/** 画布尺寸的唯一源头。
 *
 *  两种画幅,靠 `setStage()` 切换(Studio 顶栏齿轮里的「画幅」,存进编排的 doc.stage):
 *    16:9  1920×1080  横屏 —— 卡片左右分列、给人脸让位(noperson 模式下改成居中单列)
 *    9:16  1080×1920  竖屏 —— 手机上第一屏就是这个比例,单列、字要大
 *
 *  ⚠️ 卡组件**不要**再写字面量 1920 / 1080,一律读 STAGE.w / STAGE.h,或者用下面
 *  这几个 helper(人脸线在竖屏下不存在,边界会跟着画幅变)。
 */
export type StageAspect = "16:9" | "9:16";

/** 当前画布尺寸(可变:setStage 会就地改写,组件每次渲染读它) */
export const STAGE = { w: 1920, h: 1080 };

/** 切换画幅:只在 Studio 顶栏 / 导出注入时调用 */
export function setStage(aspect: StageAspect): void {
  if (aspect === "9:16") {
    STAGE.w = 1080;
    STAGE.h = 1920;
  } else {
    STAGE.w = 1920;
    STAGE.h = 1080;
  }
}

export function stageAspect(): StageAspect {
  return STAGE.w > STAGE.h ? "16:9" : "9:16";
}

export function isPortrait(): boolean {
  return STAGE.w < STAGE.h;
}

/** 左锚点卡的右缘极限(横屏 = 人脸线 700;竖屏没有人物可避,给满宽) */
export function leftFaceLimit(): number {
  return isPortrait() ? STAGE.w - 64 : 700;
}

/** 右锚点卡的左缘极限(横屏 = 1220 = 1920 − 700;竖屏给满宽) */
export function rightFaceLimit(): number {
  return isPortrait() ? 64 : STAGE.w - 700;
}

/** 竖屏是单列构图:所有卡都居中,宽度按「满宽减边距」算,不再按左右分列 */
export function cardMaxWidth(margin = 120): number {
  return isPortrait() ? STAGE.w - margin * 2 : 0;
}
