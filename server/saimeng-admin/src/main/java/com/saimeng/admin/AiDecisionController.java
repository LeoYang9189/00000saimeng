package com.saimeng.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/admin/ai/workbench")
public class AiDecisionController {
    private final AiDecisionService decisions;
    private final AiWorkbenchController streams;
    public AiDecisionController(AiDecisionService decisions, AiWorkbenchController streams) {
        this.decisions = decisions; this.streams = streams;
    }
    @PostMapping(value = "/selection/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> selection(@Valid @RequestBody SelectionRequest request) {
        return streams.stream(events -> {
            events.accept("selection", decisions.select(request.category().trim(), request.benchmark().trim(), request.notes(), events));
            events.accept("done", true);
        });
    }
    @PostMapping(value = "/analysis/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> analysis(@Valid @RequestBody AnalysisRequest request) {
        return streams.stream(events -> {
            events.accept("analysis", decisions.analyze(request.productId(), request.notes(), events));
            events.accept("done", true);
        });
    }
    public record SelectionRequest(@NotBlank @Size(max = 80) String category,
                                   @NotBlank @Size(max = 120) String benchmark, @NotNull @Size(max = 2000) String notes) {}
    public record AnalysisRequest(@NotNull @Positive Long productId, @NotNull @Size(max = 2000) String notes) {}
}
