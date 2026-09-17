package com.saimeng.ai;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.common.BusinessException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class AiWorkbenchServiceTest {
    private final KimiClient kimi = mock(KimiClient.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private final AiWorkbenchService.ProductFacts product = new AiWorkbenchService.ProductFacts(
            "4001", "法国红酒", "WINE-01", "测试品牌", "酒水", "法国", "果香丰富", "750ml",
            "葡萄汁", new BigDecimal("259"), List.of("/products/wine.png"));
    private final String copyJson = """
            {"title":"一杯果香，慢享晚餐","subtitle":"法国红酒","body":"用于晚餐搭配的文案。",
             "callToAction":"了解商品详情","tags":["晚餐搭配"],"imagePrompt":"自然光餐桌，产品居中，文字留白。"}
            """;

    @Test void preparesAllChannelsAndStylesWithoutPretendingToGenerate() {
        var service = new AiWorkbenchService(kimi, new PendingMaterialImageGenerator(), mapper);
        for (var channel : AiWorkbenchService.CHANNELS) {
            for (var style : AiWorkbenchService.STYLES) {
                var result = service.createMaterial(product, channel.key(), style.key(), "不展示价格");
                assertThat(result.status()).isEqualTo("WAITING_FOR_KEY");
                assertThat(result.copy()).isNull();
                assertThat(result.image().imageUrls()).isEmpty();
                assertThat(result.brief().prompt()).contains("法国红酒", "不展示价格", style.label());
                assertThat(result.image().request().referenceImages()).containsExactly("/products/wine.png");
                assertThat(result.image().request().width()).isEqualTo(channel.width());
            }
        }
        verify(kimi, never()).complete(anyString(), anyString(), any());
    }

    @Test void rejectsUnsupportedChannelAndStyleBeforeCallingModel() {
        var service = new AiWorkbenchService(kimi, new PendingMaterialImageGenerator(), mapper);
        assertThatThrownBy(() -> service.createMaterial(product, "UNKNOWN", "MINIMAL", ""))
                .isInstanceOf(BusinessException.class).hasMessageContaining("发布渠道");
        assertThatThrownBy(() -> service.createMaterial(product, "A4", "UNKNOWN", ""))
                .isInstanceOf(BusinessException.class).hasMessageContaining("视觉风格");
        verifyNoInteractions(kimi);
    }

    @Test void returnsRealCopyAndExplicitPendingImageStatus() {
        when(kimi.isReady()).thenReturn(true);
        when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn(copyJson);
        var result = new AiWorkbenchService(kimi, new PendingMaterialImageGenerator(), mapper)
                .createMaterial(product, "A4", "MINIMAL", "门店派发");
        assertThat(result.status()).isEqualTo("COPY_READY");
        assertThat(result.copy().title()).isEqualTo("一杯果香，慢享晚餐");
        assertThat(result.image().status()).isEqualTo("WAITING_FOR_PROVIDER");
        assertThat(result.image().request().width()).isEqualTo(2480);
        assertThat(result.image().request().height()).isEqualTo(3508);
        assertThat(result.image().request().prompt()).contains("自然光餐桌", "保持包装", "一杯果香");
    }

    @Test void malformedModelOutputDoesNotCreateImage() {
        var images = mock(MaterialImageGenerator.class);
        when(kimi.isReady()).thenReturn(true);
        var service = new AiWorkbenchService(kimi, images, mapper);
        for (String value : List.of("not json", "{}", "null", "{\"title\":\"标题\"}")) {
            when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn(value);
            assertThatThrownBy(() -> service.createMaterial(product, "MOMENTS", "FRESH", ""))
                    .isInstanceOf(BusinessException.class);
        }
        verifyNoInteractions(images);
    }

    @Test void keepsCopyWhenImageProviderFails() {
        var images = mock(MaterialImageGenerator.class);
        when(kimi.isReady()).thenReturn(true);
        when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn(copyJson);
        when(images.generate(any())).thenThrow(new RuntimeException("private provider error"));
        var result = new AiWorkbenchService(kimi, images, mapper).createMaterial(product, "LANDSCAPE", "PREMIUM", "");
        assertThat(result.copy()).isNotNull();
        assertThat(result.status()).isEqualTo("COPY_READY");
        assertThat(result.image().status()).isEqualTo("FAILED");
        assertThat(result.message()).doesNotContain("private provider error");
    }

    @Test void chatUsesSameClientWithQuotedHistoryAndRejectsUnknownSkills() {
        when(kimi.complete(anyString(), anyString(), isNull())).thenReturn("建议先明确目标客群。");
        var service = new AiWorkbenchService(kimi, new PendingMaterialImageGenerator(), mapper);
        assertThat(service.chat("selection", "如何选品", List.of(new AiWorkbenchService.ChatTurn("user", "预算100元"))).content())
                .contains("目标客群");
        verify(kimi).complete(anyString(), contains("预算100元"), isNull());
        assertThatThrownBy(() -> service.chat("unknown", "test", List.of())).isInstanceOf(BusinessException.class);
    }

    @Test void streamsPromptThenKeepsCopyBeforeImageGeneration() {
        when(kimi.isReady()).thenReturn(true);
        when(kimi.stream(anyString(), anyString(), any())).thenAnswer(invocation -> {
            java.util.function.Consumer<String> delta = invocation.getArgument(2);
            delta.accept("自然光，产品居中。");
            return "自然光，产品居中。";
        });
        when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn(copyJson);
        var events = new java.util.ArrayList<String>();
        var images = mock(MaterialImageGenerator.class);
        when(images.generate(any())).thenAnswer(invocation -> {
            assertThat(events).containsSubsequence("prompt_delta", "stage", "material", "stage");
            throw new RuntimeException("image failure");
        });
        var result = new AiWorkbenchService(kimi, images, mapper).createMaterial(product, "A4", "MINIMAL", "",
                (event, value) -> events.add(event));
        assertThat(result.copy()).isNotNull();
        assertThat(result.image().status()).isEqualTo("FAILED");
    }

    @Test void campaignRequirementsReachVisiblePromptCopyAndImageWithoutLosingRefinedPlan() {
        when(kimi.isReady()).thenReturn(true);
        String notes = "双十一大促，红紫撞色，不写价格，角落标注演示素材";
        when(kimi.stream(anyString(), anyString(), any())).thenReturn("主标题双十一大促，平面字，红紫撞色。");
        when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn("""
                {"title":"双十一大促","subtitle":"法国红酒","body":"活动主题文案。",
                 "callToAction":"了解商品","tags":["双十一"],"imagePrompt":"最终精修：平面字，红紫撞色，网格留白，角落标注演示素材。"}
                """);
        var result = new AiWorkbenchService(kimi, new PendingMaterialImageGenerator(), mapper)
                .createMaterial(product, "MOMENTS", "PROMOTION", notes, (event, value) -> {});
        var visible = org.mockito.ArgumentCaptor.forClass(String.class);
        var copy = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(kimi).stream(anyString(), visible.capture(), any());
        verify(kimi).complete(anyString(), copy.capture(), anyMap());
        assertThat(visible.getValue()).contains(notes, "主题与必显文字", "促销醒目", "平面排版", "不禁止主题文字",
                "统一网格", "最多两种主色", "只确定一套方案").doesNotContain("至少两种明确促销图形", "使用超大粗体");
        assertThat(copy.getValue()).contains(notes, "title 必须包含活动名称", "商品名放 subtitle");
        assertThat(result.image().request().prompt()).contains(notes, "画面逐字主标题：双十一大促",
                "平面字", "最终精修", "网格留白", "演示素材", "没有遗漏补充要求")
                .doesNotContain("仅作创作参考", "\n视觉创意：", "至少两种符合所选风格的视觉元素");
    }

    @Test void customAndNegativeRequirementsRemainExplicitWithoutInventingCampaigns() {
        var service = new AiWorkbenchService(kimi, new PendingMaterialImageGenerator(), mapper);
        var result = service.createMaterial(product, "LANDSCAPE", "MINIMAL", "周年庆，只要蓝色氛围，不要主题文字");
        assertThat(result.image().request().prompt()).contains("周年庆，只要蓝色氛围，不要主题文字",
                "用户明确的否定要求优先", "不强加文字");
        var noCampaign = service.createMaterial(product, "MOMENTS", "FRESH", "");
        assertThat(noCampaign.image().request().prompt()).contains("不自行添加活动", "未提该主题时不要套用");
    }
}
