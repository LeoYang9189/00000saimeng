package com.saimeng.system;

import com.saimeng.common.BusinessException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 验证码服务。
 */
@Service
public class VerificationCodeService {

    private static final Logger log = LoggerFactory.getLogger(VerificationCodeService.class);
    private static final Duration CODE_EXPIRE_DURATION = Duration.ofMinutes(5);

    private final Map<String, VerificationCodeRecord> verificationCodeMap = new ConcurrentHashMap<>();

    /**
     * 发送验证码。
     *
     * @param phone 手机号
     * @return 过期秒数
     */
    public long sendCode(String phone) {
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plus(CODE_EXPIRE_DURATION);
        verificationCodeMap.put(phone, new VerificationCodeRecord(code, expiresAt));
        log.info("开发环境短信验证码，phone={}, code={}, expiresAt={}", phone, code, expiresAt);
        return CODE_EXPIRE_DURATION.toSeconds();
    }

    /**
     * 校验并消费验证码。
     *
     * @param phone 手机号
     * @param verificationCode 验证码
     */
    public void verifyCode(String phone, String verificationCode) {
        VerificationCodeRecord record = verificationCodeMap.get(phone);
        if (record == null) {
            throw new BusinessException("请先获取验证码");
        }
        if (record.expiresAt().isBefore(LocalDateTime.now())) {
            verificationCodeMap.remove(phone);
            throw new BusinessException("验证码已过期，请重新获取");
        }
        if (!record.code().equals(verificationCode)) {
            throw new BusinessException("验证码错误");
        }
        verificationCodeMap.remove(phone);
    }

    private record VerificationCodeRecord(String code, LocalDateTime expiresAt) {
    }
}
