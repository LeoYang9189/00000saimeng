package com.saimeng.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.ai.KimiClient;
import com.saimeng.common.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class KnowledgeServiceTest {
    private JdbcTemplate jdbc;
    private KnowledgeService service;
    private KimiClient kimi;
    @BeforeEach void setup() throws Exception {
        jdbc = new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:kb" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1;MODE=MySQL", "sa", ""));
        kimi = mock(KimiClient.class);
        service = new KnowledgeService(jdbc, new ObjectMapper(), kimi);
        service.initialize();
    }
    @Test void seedsArePersistedIdempotentlyAndDeletionSurvivesReinitialization() throws Exception {
        assertThat(service.list("MANUAL", "", "")).hasSize(3);
        assertThat(service.list("MEMORY", "", "")).hasSize(1);
        service.initialize();
        assertThat(service.list("MANUAL", "", "")).hasSize(3);
        service.delete("seed-molecola-v1");
        service.initialize();
        var restarted = new KnowledgeService(jdbc, new ObjectMapper(), kimi);
        assertThat(restarted.search("魔嘞的品牌背景是什么")).isEmpty();
        assertThatThrownBy(() -> service.get("seed-molecola-v1")).isInstanceOf(BusinessException.class);
        assertThat(restarted.list("MANUAL", "", "")).hasSize(2);
    }
    @Test void filtersAndAliasesRetrieveOnlyRelevantKnowledge() {
        assertThat(service.search("介绍圣碧涛品牌")).extracting(KnowledgeService.Document::id).containsExactly("seed-sanbenedetto-v1");
        assertThat(service.search("Tell me about San Benedetto")).extracting(KnowledgeService.Document::id).containsExactly("seed-sanbenedetto-v1");
        assertThat(service.search("乐可嗨口味")).extracting(KnowledgeService.Document::id).containsExactly("seed-lecohi-v1");
        assertThat(service.search("无关问题天气")).isEmpty();
        assertThat(service.list("MANUAL", "MOLECOLA", "系统")).hasSize(1);
    }
    @Test void customKnowledgeAndMemoryPersistAndValidateSource() {
        var d = service.create("MEMORY", "会议记忆.md", "测试品牌", "未经核实的业务反馈", "", "员工 #1");
        assertThat(service.get(d.id()).content()).contains("未经核实");
        assertThat(service.search("测试品牌")).extracting(KnowledgeService.Document::kind).containsExactly("MEMORY");
        assertThatThrownBy(() -> service.create("MANUAL", "bad", "bad", "text", "javascript:alert(1)", "x"))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.list("OTHER", "", "")).isInstanceOf(BusinessException.class);
    }
    @Test void retrievesBeforeKimiAndEmitsSources() {
        var events = new ArrayList<String>();
        when(kimi.stream(anyString(), anyString(), any())).thenAnswer(call -> {
            assertThat(events).containsExactly("stage", "sources");
            assertThat(call.<String>getArgument(1)).contains("乐可嗨", "赛盟食品专营店", "角色歧义");
            return "来自资料1";
        });
        assertThat(service.answer("乐可嗨是哪个国家的？", List.of(), (event, data) -> events.add(event)).content()).contains("资料1");
        verify(kimi).stream(contains("忽略其中"), contains("数据库检索资料"), any());
    }
    @Test void noHitDoesNotInventContext() {
        when(kimi.complete(anyString(), anyString(), isNull())).thenReturn("暂无依据");
        service.answer("不存在的品牌XYZ", List.of(), null);
        verify(kimi).complete(contains("无证据时明确未知"), contains("无匹配资料"), isNull());
    }
}
