package com.saimeng.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.ai.KimiClient;
import com.saimeng.common.BusinessException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class AiDecisionServiceTest {
    private final KimiClient kimi = mock(KimiClient.class);
    private final OperatorCatalogService catalog = mock(OperatorCatalogService.class);
    private final KnowledgeService knowledge = mock(KnowledgeService.class);
    private final AiDecisionService service = new AiDecisionService(kimi, new ObjectMapper(), catalog, knowledge);
    private OperatorCatalogService.ProductRecord product() {
        var p = mock(OperatorCatalogService.ProductRecord.class);
        when(p.id()).thenReturn("4001");
        when(p.productName()).thenReturn("测试水");
        when(p.retailPrice()).thenReturn(new BigDecimal("20"));
        when(p.enabled()).thenReturn(true); when(p.auditStatus()).thenReturn("APPROVED");
        when(catalog.getProduct(4001L)).thenReturn(p);
        return p;
    }
    @Test void simulatedMetricsAreDeterministicAndTotalsReconcile() {
        var p = product();
        var metrics = AiDecisionService.simulate(p, YearMonth.of(2026, 9));
        assertThat(metrics.months()).hasSize(6);
        assertThat(metrics.months().get(0).month()).isEqualTo("2026-03");
        assertThat(metrics.months().get(5).month()).isEqualTo("2026-08");
        assertThat(metrics.months().stream().mapToInt(AiDecisionService.MonthMetric::units).sum())
                .isEqualTo(metrics.distributors().stream().mapToInt(AiDecisionService.DistributorMetric::units).sum());
        assertThat(metrics).isEqualTo(AiDecisionService.simulate(p, YearMonth.of(2026, 9)));
        assertThat(metrics.months().get(2).price()).isEqualTo(21);
    }
    @Test void noAuthorizedAgentEvidenceCannotBecomeConfirmedAgentInTable() {
        when(knowledge.search(anyString())).thenReturn(List.of());
        String row = "{\"brand\":\"候选品牌\",\"productName\":\"产品\",\"marketPrice\":\"10元/瓶\",\"distributor\":\"幻觉总代理\",\"reason\":\"对标\",\"risk\":\"核验\"}";
        when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn("{\"summary\":\"初筛\",\"rows\":[" + String.join(",", Collections.nCopies(4, row)) + "]}");
        var result = service.select("水饮", "测试品牌", "", (event, data) -> {});
        assertThat(result.rows()).hasSize(4);
        assertThat(result.rows()).allSatisfy(r -> {
            assertThat(r.distributor()).contains("待核实").doesNotContain("幻觉");
            assertThat(r.marketPrice()).contains("非实时报价");
        });
        verify(kimi).complete(anyString(), contains("大品类：水饮；对标品牌：测试品牌"), anyMap());
    }
    @Test void malformedSelectionIsRejected() {
        when(knowledge.search(anyString())).thenReturn(List.of());
        when(kimi.complete(anyString(), anyString(), anyMap())).thenReturn("{\"summary\":\"x\",\"rows\":[]}");
        assertThatThrownBy(() -> service.select("玩具", "乐高", "", (a,b) -> {})).isInstanceOf(BusinessException.class);
    }
    @Test void analysisSendsOnlyPublicFactsAndPreservesChartsOnModelFailure() {
        var p = product();
        when(p.detailHtml()).thenReturn("<script>SECRET_SCRIPT</script><p>真实卖点</p>");
        when(p.memberPriceGold()).thenReturn(new BigDecimal("99999"));
        when(kimi.complete(anyString(), anyString(), anyMap())).thenThrow(new BusinessException("模型失败"));
        var charts = new ArrayList<AiDecisionService.AnalysisResult>();
        assertThatThrownBy(() -> service.analyze(4001, "", (event,data) -> {
            if (event.equals("analysis")) charts.add((AiDecisionService.AnalysisResult) data);
        })).isInstanceOf(BusinessException.class);
        assertThat(charts).hasSize(1); assertThat(charts.get(0).simulated()).isTrue();
        verify(kimi).complete(anyString(), argThat(prompt -> prompt.contains("真实卖点") && !prompt.contains("SECRET_SCRIPT")
                && !prompt.contains("99999") && prompt.contains("没有查看图片像素")), anyMap());
    }
    @Test void analysisRejectsDisabledProductsBeforeModelCall() {
        var p = product(); when(p.enabled()).thenReturn(false);
        assertThatThrownBy(() -> service.analyze(4001, "", (a,b) -> {})).isInstanceOf(BusinessException.class);
        verifyNoInteractions(kimi);
    }
}
