package com.saimeng.admin;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/knowledge")
public class KnowledgeController {
    private final KnowledgeService knowledge;
    public KnowledgeController(KnowledgeService knowledge) { this.knowledge = knowledge; }

    @GetMapping
    public ApiResponse<List<KnowledgeService.Document>> list(@RequestParam(defaultValue = "MANUAL") String kind,
            @RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "") String uploader) {
        return ApiResponse.success(knowledge.list(kind, keyword, uploader));
    }
    @GetMapping("/{id}")
    public ApiResponse<KnowledgeService.Document> get(@PathVariable String id) { return ApiResponse.success(knowledge.get(id)); }
    @PostMapping
    public ApiResponse<KnowledgeService.Document> create(@Valid @RequestBody CreateRequest request) {
        return ApiResponse.success(knowledge.create(request.kind(), request.fileName(), request.keywords(),
                request.content(), request.sourceUrl(), "员工 #" + CurrentUserContext.getCurrentUser().userId()));
    }
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) { knowledge.delete(id); return ApiResponse.success(null); }

    public record CreateRequest(@NotBlank @Pattern(regexp = "MANUAL|MEMORY") String kind,
            @NotBlank @Size(max = 200) String fileName, @NotNull @Size(max = 1000) String keywords,
            @NotBlank @Size(max = 30000) String content, @NotNull @Size(max = 2000) String sourceUrl) {}
}
