package com.saimeng.admin;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 运营后台报价单接口。
 */
@RestController
public class OperatorQuotationController {

    private final OperatorQuotationService operatorQuotationService;

    public OperatorQuotationController(OperatorQuotationService operatorQuotationService) {
        this.operatorQuotationService = operatorQuotationService;
    }

    @GetMapping("/api/admin/quotations/bootstrap")
    public ApiResponse<OperatorQuotationService.QuotationBootstrapPayload> getBootstrap() {
        return ApiResponse.success(operatorQuotationService.getBootstrap());
    }

    @GetMapping("/api/admin/quotations/{quotationId}")
    public ApiResponse<OperatorQuotationService.QuotationRecord> getQuotation(@PathVariable Long quotationId) {
        return ApiResponse.success(operatorQuotationService.getQuotation(quotationId));
    }

    @PostMapping("/api/admin/quotations")
    public ApiResponse<OperatorQuotationService.QuotationRecord> createQuotation(
            @Valid @RequestBody OperatorQuotationService.QuotationUpsertRequest request) {
        return ApiResponse.success(operatorQuotationService.createQuotation(
                CurrentUserContext.getCurrentUser().userId(),
                request));
    }

    @PutMapping("/api/admin/quotations/{quotationId}")
    public ApiResponse<OperatorQuotationService.QuotationRecord> updateQuotation(
            @PathVariable Long quotationId,
            @Valid @RequestBody OperatorQuotationService.QuotationUpsertRequest request) {
        return ApiResponse.success(operatorQuotationService.updateQuotation(quotationId, request));
    }

    @DeleteMapping("/api/admin/quotations/{quotationId}")
    public ApiResponse<Void> deleteQuotation(@PathVariable Long quotationId) {
        operatorQuotationService.deleteQuotation(quotationId);
        return ApiResponse.success(null);
    }

    @GetMapping("/api/admin/quotations/{quotationId}/export")
    public ResponseEntity<byte[]> exportQuotation(@PathVariable Long quotationId) {
        OperatorQuotationService.ExportFile exportFile = operatorQuotationService.exportQuotation(quotationId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + exportFile.fileName())
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(exportFile.content());
    }
}
