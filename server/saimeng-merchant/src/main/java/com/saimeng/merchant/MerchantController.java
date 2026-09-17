package com.saimeng.merchant;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 分销商入驻接口。
 */
@RestController
public class MerchantController {

    private final MerchantApplicationService merchantApplicationService;

    public MerchantController(MerchantApplicationService merchantApplicationService) {
        this.merchantApplicationService = merchantApplicationService;
    }

    /**
     * 提交分销商入驻申请。
     *
     * @param request 申请请求
     * @return 申请记录
     */
    @PostMapping("/api/merchant/applications")
    public ApiResponse<MerchantApplicationService.MerchantApplicationRecord> submitApplication(
            @Valid @RequestBody MerchantApplicationRequest request) {
        Long userId = CurrentUserContext.getCurrentUser().userId();
        return ApiResponse.success(merchantApplicationService.submit(
                userId,
                request.storeName(),
                request.companyName(),
                request.contactName(),
                request.businessScope()));
    }

    /**
     * 获取当前用户申请记录。
     *
     * @return 申请记录
     */
    @GetMapping("/api/merchant/applications/current")
    public ApiResponse<MerchantApplicationService.MerchantApplicationRecord> getCurrentApplication() {
        return ApiResponse.success(merchantApplicationService.getCurrentApplication(CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 查询全部分销商申请。
     *
     * @return 申请列表
     */
    @GetMapping("/api/admin/merchant-applications")
    public ApiResponse<List<MerchantApplicationService.MerchantApplicationRecord>> listApplications() {
        return ApiResponse.success(merchantApplicationService.listAll());
    }

    /**
     * 审核通过分销商申请。
     *
     * @param applicationId 申请 ID
     * @return 审核结果
     */
    @PostMapping("/api/admin/merchant-applications/{applicationId}/approve")
    public ApiResponse<MerchantApplicationService.MerchantApplicationRecord> approveApplication(
            @PathVariable Long applicationId) {
        return ApiResponse.success(merchantApplicationService.approve(applicationId));
    }

    /**
     * 驳回分销商申请。
     *
     * @param applicationId 申请 ID
     * @param request 驳回请求
     * @return 审核结果
     */
    @PostMapping("/api/admin/merchant-applications/{applicationId}/reject")
    public ApiResponse<MerchantApplicationService.MerchantApplicationRecord> rejectApplication(
            @PathVariable Long applicationId,
            @Valid @RequestBody ReviewRequest request) {
        return ApiResponse.success(merchantApplicationService.reject(applicationId, request.remark()));
    }

    public record MerchantApplicationRequest(
            @NotBlank(message = "店铺名称不能为空") String storeName,
            @NotBlank(message = "公司名称不能为空") String companyName,
            @NotBlank(message = "联系人不能为空") String contactName,
            @NotBlank(message = "经营说明不能为空") String businessScope) {
    }

    public record ReviewRequest(@NotBlank(message = "审核说明不能为空") String remark) {
    }
}
