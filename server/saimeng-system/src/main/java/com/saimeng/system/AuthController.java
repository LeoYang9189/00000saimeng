package com.saimeng.system;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.auth.TokenService;
import com.saimeng.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证与账号接口。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserAccountService userAccountService;
    private final OperatorEnterpriseService operatorEnterpriseService;
    private final TokenService tokenService;

    public AuthController(
            UserAccountService userAccountService,
            OperatorEnterpriseService operatorEnterpriseService,
            TokenService tokenService) {
        this.userAccountService = userAccountService;
        this.operatorEnterpriseService = operatorEnterpriseService;
        this.tokenService = tokenService;
    }

    /**
     * 注册账号。
     *
     * @param request 注册请求
     * @return Token 与用户信息
     */
    @PostMapping("/register")
    public ApiResponse<AuthPayload> register(@Valid @RequestBody RegisterRequest request) {
        UserProfile profile = userAccountService.register(request.phone(), request.verificationCode());
        return ApiResponse.success(buildPayload(profile));
    }

    /**
     * 登录账号。
     *
     * @param request 登录请求
     * @return Token 与用户信息
     */
    @PostMapping("/login")
    public ApiResponse<AuthPayload> login(@Valid @RequestBody LoginRequest request) {
        UserProfile profile = userAccountService.login(request.phone(), request.password());
        return ApiResponse.success(buildPayload(profile));
    }

    /**
     * 运营员工登录。
     *
     * @param request 运营登录请求
     * @return Token 与用户信息
     */
    @PostMapping("/operator/login")
    public ApiResponse<AuthPayload> loginOperator(@Valid @RequestBody OperatorLoginRequest request) {
        UserProfile profile = operatorEnterpriseService.loginOperator(request.account(), request.password());
        return ApiResponse.success(buildPayload(profile));
    }

    /**
     * 验证码登录。
     *
     * @param request 验证码登录请求
     * @return Token 与用户信息
     */
    @PostMapping("/login/sms")
    public ApiResponse<AuthPayload> loginWithVerificationCode(@Valid @RequestBody SmsLoginRequest request) {
        UserProfile profile = userAccountService.loginWithVerificationCode(request.phone(), request.verificationCode());
        return ApiResponse.success(buildPayload(profile));
    }

    /**
     * 发送验证码。
     *
     * @param request 发送验证码请求
     * @return 有效秒数
     */
    @PostMapping("/verification-code")
    public ApiResponse<VerificationCodePayload> sendVerificationCode(@Valid @RequestBody VerificationCodeRequest request) {
        long expiresInSeconds = userAccountService.sendVerificationCode(request.phone());
        return ApiResponse.success(new VerificationCodePayload(expiresInSeconds));
    }

    /**
     * 获取当前登录账号信息。
     *
     * @return 当前账号
     */
    @GetMapping("/me")
    public ApiResponse<UserProfile> getCurrentUserProfile() {
        return ApiResponse.success(userAccountService.getProfile(CurrentUserContext.getCurrentUser().userId()));
    }

    private AuthPayload buildPayload(UserProfile profile) {
        String token = tokenService.generateToken(profile.userId(), profile.phone(), Set.copyOf(profile.roles()));
        return new AuthPayload(token, profile);
    }

    public record RegisterRequest(
            @NotBlank(message = "手机号不能为空") String phone,
            @NotBlank(message = "验证码不能为空") String verificationCode) {
    }

    public record LoginRequest(
            @NotBlank(message = "账号不能为空") String phone,
            @NotBlank(message = "密码不能为空") String password) {
    }

    public record OperatorLoginRequest(
            @NotBlank(message = "账号不能为空") String account,
            @NotBlank(message = "密码不能为空") String password) {
    }

    public record SmsLoginRequest(
            @NotBlank(message = "手机号不能为空") String phone,
            @NotBlank(message = "验证码不能为空") String verificationCode) {
    }

    public record VerificationCodeRequest(@NotBlank(message = "手机号不能为空") String phone) {
    }

    public record VerificationCodePayload(long expiresInSeconds) {
    }

    public record AuthPayload(String token, UserProfile profile) {
    }
}
