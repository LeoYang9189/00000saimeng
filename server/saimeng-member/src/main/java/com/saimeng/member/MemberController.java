package com.saimeng.member;

import com.saimeng.auth.CurrentUser;
import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import com.saimeng.system.UserAccountService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 会员与实名认证接口。
 */
@RestController
public class MemberController {

    private final RealNameAuthService realNameAuthService;
    private final FeedbackService feedbackService;
    private final UserAccountService userAccountService;

    public MemberController(
            RealNameAuthService realNameAuthService,
            FeedbackService feedbackService,
            UserAccountService userAccountService) {
        this.realNameAuthService = realNameAuthService;
        this.feedbackService = feedbackService;
        this.userAccountService = userAccountService;
    }

    /**
     * 提交实名认证。
     *
     * @param request 认证请求
     * @return 认证记录
     */
    @PostMapping("/api/member/real-name-auth")
    public ApiResponse<RealNameAuthService.RealNameAuthRecord> submitRealNameAuth(
            @Valid @RequestBody RealNameAuthRequest request) {
        Long userId = CurrentUserContext.getCurrentUser().userId();
        return ApiResponse.success(realNameAuthService.submit(userId, request.realName(), request.idCardNo()));
    }

    /**
     * 获取当前会员信息。
     *
     * @return 会员聚合信息
     */
    @GetMapping("/api/member/profile")
    public ApiResponse<MemberProfileResponse> getCurrentMemberProfile() {
        Long userId = CurrentUserContext.getCurrentUser().userId();
        return ApiResponse.success(new MemberProfileResponse(
                userAccountService.getProfile(userId),
                realNameAuthService.getCurrentRecord(userId)));
    }

    /**
     * 查询实名认证列表。
     *
     * @return 实名认证记录
     */
    @GetMapping("/api/admin/real-name-auths")
    public ApiResponse<List<RealNameAuthService.RealNameAuthRecord>> listRealNameAuths() {
        return ApiResponse.success(realNameAuthService.listAll());
    }

    /**
     * 审核通过实名认证。
     *
     * @param authId 认证 ID
     * @return 审核结果
     */
    @PostMapping("/api/admin/real-name-auths/{authId}/approve")
    public ApiResponse<RealNameAuthService.RealNameAuthRecord> approveRealNameAuth(@PathVariable Long authId) {
        return ApiResponse.success(realNameAuthService.approve(authId));
    }

    /**
     * 驳回实名认证。
     *
     * @param authId 认证 ID
     * @param request 驳回请求
     * @return 审核结果
     */
    @PostMapping("/api/admin/real-name-auths/{authId}/reject")
    public ApiResponse<RealNameAuthService.RealNameAuthRecord> rejectRealNameAuth(
            @PathVariable Long authId,
            @Valid @RequestBody ReviewRequest request) {
        return ApiResponse.success(realNameAuthService.reject(authId, request.remark()));
    }

    /**
     * 提交商城反馈。
     *
     * @param request 反馈请求
     * @return 反馈记录
     */
    @PostMapping("/api/feedback")
    public ApiResponse<FeedbackService.FeedbackRecord> submitFeedback(@Valid @RequestBody FeedbackSubmitRequest request) {
        CurrentUser currentUser = getOptionalCurrentUser();
        return ApiResponse.success(feedbackService.submit(
                currentUser == null ? null : currentUser.userId(),
                request.feedbackType(),
                request.relatedOrderNo(),
                request.content(),
                request.contact(),
                request.attachmentNames()));
    }

    private CurrentUser getOptionalCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CurrentUser currentUser)) {
            return null;
        }
        return currentUser;
    }

    public record RealNameAuthRequest(
            @NotBlank(message = "真实姓名不能为空") String realName,
            @NotBlank(message = "身份证号不能为空") String idCardNo) {
    }

    public record ReviewRequest(@NotBlank(message = "审核说明不能为空") String remark) {
    }

    public record FeedbackSubmitRequest(
            @NotBlank(message = "反馈类型不能为空") String feedbackType,
            @Size(max = 64, message = "订单号长度不能超过 64 个字符") String relatedOrderNo,
            @NotBlank(message = "问题描述不能为空") @Size(min = 5, max = 800, message = "问题描述长度需在 5 到 800 个字符之间") String content,
            @Size(max = 128, message = "联系方式长度不能超过 128 个字符") String contact,
            List<@Size(max = 255, message = "附件名称长度不能超过 255 个字符") String> attachmentNames) {
    }

    public record MemberProfileResponse(
            com.saimeng.system.UserProfile userProfile,
            RealNameAuthService.RealNameAuthRecord realNameAuthRecord) {
    }
}
