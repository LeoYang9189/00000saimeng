package com.saimeng.auth;

import com.saimeng.common.BusinessException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * 轻量 Token 服务，当前阶段用于本地预览环境的 Bearer Token 生成与解析。
 */
@Component
public class TokenService {

    /**
     * 生成 Bearer Token。
     *
     * @param userId 用户 ID
     * @param phone 用户账号
     * @param roles 用户角色
     * @return Token 字符串
     */
    public String generateToken(Long userId, String phone, Set<String> roles) {
        String roleText = String.join(",", roles);
        String payload = userId + "|" + phone + "|" + roleText;
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 解析 Bearer Token。
     *
     * @param token Token 字符串
     * @return 当前用户信息
     */
    public CurrentUser parseToken(String token) {
        try {
            String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = raw.split("\\|", -1);
            if (parts.length != 3) {
                throw new BusinessException("Token 格式无效");
            }
            Set<String> roles = new LinkedHashSet<>();
            if (!parts[2].isBlank()) {
                roles.addAll(Arrays.asList(parts[2].split(",")));
            }
            return new CurrentUser(Long.parseLong(parts[0]), parts[1], roles);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Token 解析失败");
        }
    }
}
