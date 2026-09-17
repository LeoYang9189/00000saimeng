package com.saimeng.ai;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.common.BusinessException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class KimiClientTest {
    private HttpServer server;
    private final ObjectMapper mapper = new ObjectMapper();
    private final AtomicReference<JsonNode> request = new AtomicReference<>();
    private final AtomicReference<String> authorization = new AtomicReference<>();
    private int status = 200;
    private String response = "{\"choices\":[{\"finish_reason\":\"stop\",\"message\":{\"content\":\"可用文案\",\"reasoning_content\":\"private reasoning\"}}]}";

    @BeforeEach void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            request.set(mapper.readTree(exchange.getRequestBody()));
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(status, bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
    }
    @AfterEach void stop() { server.stop(0); }
    private KimiClient client(String key) {
        return new KimiClient(mapper, key, HttpClient.newHttpClient(),
                URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/chat/completions"));
    }
    @Test void usesFixedModelAndOnlyReturnsFinalContent() {
        assertThat(client("test-key").complete("system", "product", Map.of("type", "object"))).isEqualTo("可用文案");
        assertThat(request.get().path("model").asText()).isEqualTo("kimi-k3");
        assertThat(request.get().path("response_format").path("json_schema").path("strict").asBoolean()).isTrue();
        assertThat(request.get().path("messages").size()).isEqualTo(2);
        assertThat(authorization.get()).isEqualTo("Bearer test-key");
    }
    @Test void missingKeyMakesNoNetworkCall() {
        assertThatThrownBy(() -> client(" ").complete("system", "product", null))
                .isInstanceOf(BusinessException.class).hasMessageContaining("尚未开通");
        assertThat(request.get()).isNull();
    }
    @Test void doesNotLeakUpstreamCredentialsOrErrorBody() {
        status = 401;
        response = "private-upstream-secret";
        assertThatThrownBy(() -> client("test-key").complete("system", "product", null))
                .isInstanceOf(BusinessException.class).hasMessageContaining("授权失败")
                .hasMessageNotContaining("private-upstream-secret").hasMessageNotContaining("test-key");
    }
    @Test void rejectsTruncatedOrMalformedResponses() {
        response = "{\"choices\":[{\"finish_reason\":\"length\",\"message\":{\"content\":\"partial\"}}]}";
        assertThatThrownBy(() -> client("test-key").complete("system", "product", null)).hasMessageContaining("完整");
        response = "not json";
        assertThatThrownBy(() -> client("test-key").complete("system", "product", null)).isInstanceOf(BusinessException.class);
    }
}
