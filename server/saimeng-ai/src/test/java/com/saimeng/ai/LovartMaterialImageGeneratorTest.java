package com.saimeng.ai;

import static org.assertj.core.api.Assertions.assertThat;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class LovartMaterialImageGeneratorTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test void doesNotGenerateWithoutConfigurationOrPublicReference() {
        var request = new MaterialImageGenerator.ImageRequest("1", "Product", List.of("/local.png"), 1080, 1440, "Prompt");
        var missing = new LovartMaterialImageGenerator(mapper, "", "", "");
        assertThat(missing.isReady()).isFalse();
        assertThat(missing.generate(request).status()).isEqualTo("WAITING_FOR_PROVIDER");
        var configured = new LovartMaterialImageGenerator(mapper, "test", "test", "project");
        assertThat(configured.generate(request).status()).isEqualTo("WAITING_FOR_REFERENCE");
    }

    @Test void extractsOnlyActualHttpsImageArtifacts() throws Exception {
        var output = mapper.readTree("""
                {"items":[{"artifacts":[
                  {"type":"image","content":"https://cdn.example.com/result.png"},
                  {"type":"image","content":"https://cdn.example.com/result.png"},
                  {"type":"text","content":"not an image"},
                  {"type":"image","content":"javascript:alert(1)"}
                ]}]}
                """);
        assertThat(LovartMaterialImageGenerator.imageUrls(output)).containsExactly("https://cdn.example.com/result.png");
    }

    @Test void preservesProviderRequestForCorrectReferencesWithoutSecrets() throws Exception {
        var output = mapper.readTree("""
                {"items":[{"type":"assistant","text":"参考图与商品不匹配，请上传实际包装图。 sk-privatecredential123456"}]}
                """);
        assertThat(LovartMaterialImageGenerator.assistantMessage(output))
                .contains("请上传实际包装图").doesNotContain("privatecredential");
    }

    @Test void sendsTheUploadedMainImageAsAttachmentAndPromptReference() {
        var generator = new LovartMaterialImageGenerator(mapper, "test", "test", "project");
        var request = new MaterialImageGenerator.ImageRequest("4003", "Mineral water",
                List.of("/home/main.png", "/home/unrelated-gallery.png"), 1920, 1080, "Create a poster");
        String uploaded = "https://cdn.example.com/uploaded-main.png";
        var payload = generator.chatPayload(request, uploaded);
        assertThat(payload.get("attachments")).isEqualTo(List.of(uploaded));
        assertThat(payload.get("prompt").toString()).contains(uploaded, "4003", "Mineral water", "Create a poster")
                .doesNotContain("unrelated-gallery.png");
        assertThat(payload).doesNotContainKeys("thread_id");
        assertThat(mapper.valueToTree(payload).path("tool_config").path("prefer_tool_categories").path("IMAGE").get(0).asText())
                .isEqualTo("generate_image_gpt_image_2_5_flare");
        assertThat(mapper.valueToTree(payload).path("tool_config").path("include_tools").get(0).asText())
                .isEqualTo("generate_image_gpt_image_2_5_flare");
        assertThat(payload.get("prompt").toString()).contains("不要改用其他模型");
    }

    @Test void summarizesRejectedToolsWithoutEchoingProviderMessage() throws Exception {
        var output = mapper.readTree("""
                {"failures":[{"tool_hint":"generate_image_gpt_image_2_5_flare","code":"MODEL_UNAVAILABLE","message":"private details"}]}
                """);
        assertThat(LovartMaterialImageGenerator.failureSummary(output))
                .contains("generate_image_gpt_image_2_5_flare", "MODEL_UNAVAILABLE").doesNotContain("private details");
    }
}
