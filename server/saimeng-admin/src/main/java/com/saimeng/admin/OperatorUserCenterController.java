package com.saimeng.admin;

import com.saimeng.common.ApiResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 运营后台用户中心接口。
 */
@RestController
@RequestMapping("/api/admin/user-center")
public class OperatorUserCenterController {

    private final OperatorUserCenterService operatorUserCenterService;

    public OperatorUserCenterController(OperatorUserCenterService operatorUserCenterService) {
        this.operatorUserCenterService = operatorUserCenterService;
    }

    /**
     * 获取用户中心初始化数据。
     *
     * @return 初始化数据
     */
    @GetMapping("/bootstrap")
    public ApiResponse<OperatorUserCenterService.UserCenterBootstrapPayload> getBootstrap() {
        return ApiResponse.success(operatorUserCenterService.getBootstrap());
    }

    /**
     * 获取客户画像外部数据接口模板。
     *
     * @return 接口模板
     */
    @GetMapping("/portraits/external-template")
    public ApiResponse<OperatorUserCenterService.PortraitExternalDataTemplateRecord> getPortraitExternalTemplate() {
        return ApiResponse.success(operatorUserCenterService.getPortraitExternalDataTemplate());
    }

    /**
     * 创建客户。
     *
     * @param request 创建请求
     * @return 客户记录
     */
    @PostMapping("/users")
    public ApiResponse<OperatorUserCenterService.CustomerRecord> createUser(
            @RequestBody OperatorUserCenterService.UserUpsertRequest request) {
        return ApiResponse.success(operatorUserCenterService.createUser(request));
    }

    /**
     * 更新客户。
     *
     * @param userId 用户 ID
     * @param request 更新请求
     * @return 客户记录
     */
    @PutMapping("/users/{userId}")
    public ApiResponse<OperatorUserCenterService.CustomerRecord> updateUser(
            @PathVariable Long userId,
            @RequestBody OperatorUserCenterService.UserUpsertRequest request) {
        return ApiResponse.success(operatorUserCenterService.updateUser(userId, request));
    }

    /**
     * 删除客户。
     *
     * @param userId 用户 ID
     * @return 空响应
     */
    @DeleteMapping("/users/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
        operatorUserCenterService.deleteUser(userId);
        return ApiResponse.success(null);
    }

    /**
     * 通过分销商认证。
     *
     * @param applicationId 申请 ID
     * @return 审核记录
     */
    @PostMapping("/reviews/{applicationId}/approve")
    public ApiResponse<OperatorUserCenterService.MerchantReviewRecord> approveReview(@PathVariable Long applicationId) {
        return ApiResponse.success(operatorUserCenterService.approveMerchantApplication(applicationId));
    }

    /**
     * 驳回分销商认证。
     *
     * @param applicationId 申请 ID
     * @param request 驳回请求
     * @return 审核记录
     */
    @PostMapping("/reviews/{applicationId}/reject")
    public ApiResponse<OperatorUserCenterService.MerchantReviewRecord> rejectReview(
            @PathVariable Long applicationId,
            @RequestBody OperatorUserCenterService.ReviewRejectRequest request) {
        return ApiResponse.success(operatorUserCenterService.rejectMerchantApplication(applicationId, request));
    }

    /**
     * 创建企业。
     *
     * @param request 创建请求
     * @return 企业记录
     */
    @PostMapping("/companies")
    public ApiResponse<OperatorUserCenterService.DistributorEnterpriseRecord> createEnterprise(
            @RequestBody OperatorUserCenterService.EnterpriseUpsertRequest request) {
        return ApiResponse.success(operatorUserCenterService.createEnterprise(request));
    }

    /**
     * 更新企业。
     *
     * @param enterpriseId 企业 ID
     * @param request 更新请求
     * @return 企业记录
     */
    @PutMapping("/companies/{enterpriseId}")
    public ApiResponse<OperatorUserCenterService.DistributorEnterpriseRecord> updateEnterprise(
            @PathVariable Long enterpriseId,
            @RequestBody OperatorUserCenterService.EnterpriseUpsertRequest request) {
        return ApiResponse.success(operatorUserCenterService.updateEnterprise(enterpriseId, request));
    }

    /**
     * 创建会员等级。
     *
     * @param request 创建请求
     * @return 等级记录
     */
    @PostMapping("/members")
    public ApiResponse<OperatorUserCenterService.MemberLevelConfigRecord> createMemberLevel(
            @RequestBody OperatorUserCenterService.MemberLevelUpsertRequest request) {
        return ApiResponse.success(operatorUserCenterService.createMemberLevel(request));
    }

    /**
     * 更新会员等级。
     *
     * @param levelId 等级 ID
     * @param request 更新请求
     * @return 等级记录
     */
    @PutMapping("/members/{levelId}")
    public ApiResponse<OperatorUserCenterService.MemberLevelConfigRecord> updateMemberLevel(
            @PathVariable Long levelId,
            @RequestBody OperatorUserCenterService.MemberLevelUpsertRequest request) {
        return ApiResponse.success(operatorUserCenterService.updateMemberLevel(levelId, request));
    }

    /**
     * 删除会员等级。
     *
     * @param levelId 等级 ID
     * @return 空响应
     */
    @DeleteMapping("/members/{levelId}")
    public ApiResponse<Void> deleteMemberLevel(@PathVariable Long levelId) {
        operatorUserCenterService.deleteMemberLevel(levelId);
        return ApiResponse.success(null);
    }

    /**
     * 获取会员中心公开配置。
     *
     * @return 公开配置
     */
    @GetMapping("/public/member-center-config")
    public ApiResponse<OperatorUserCenterService.PublicMemberCenterConfigPayload> getMemberCenterConfig() {
        return ApiResponse.success(operatorUserCenterService.getMemberCenterConfig());
    }
}
