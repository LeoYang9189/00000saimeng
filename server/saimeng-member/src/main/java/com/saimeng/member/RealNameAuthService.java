package com.saimeng.member;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.saimeng.common.BusinessException;
import com.saimeng.member.entity.MemberRealNameAuthEntity;
import com.saimeng.member.mapper.MemberRealNameAuthMapper;
import com.saimeng.system.RoleCodes;
import com.saimeng.system.UserAccountService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 实名认证服务。
 */
@Service
public class RealNameAuthService {

    private final MemberRealNameAuthMapper memberRealNameAuthMapper;
    private final UserAccountService userAccountService;

    public RealNameAuthService(
            MemberRealNameAuthMapper memberRealNameAuthMapper,
            UserAccountService userAccountService) {
        this.memberRealNameAuthMapper = memberRealNameAuthMapper;
        this.userAccountService = userAccountService;
    }

    /**
     * 提交实名认证。
     *
     * @param userId 用户 ID
     * @param realName 真实姓名
     * @param idCardNo 身份证号
     * @return 实名认证记录
     */
    @Transactional
    public RealNameAuthRecord submit(Long userId, String realName, String idCardNo) {
        MemberRealNameAuthEntity entity = findByUserId(userId);
        if (entity != null && "APPROVED".equals(entity.getStatus())) {
            throw new BusinessException("实名认证已通过，无需重复提交");
        }
        if (entity == null) {
            entity = new MemberRealNameAuthEntity();
            entity.setId(IdWorker.getId());
            entity.setUserId(userId);
        }
        entity.setRealName(realName);
        entity.setIdCardNo(idCardNo);
        entity.setStatus("PENDING");
        entity.setReviewRemark(null);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setReviewedAt(null);
        if (memberRealNameAuthMapper.selectById(entity.getId()) == null) {
            memberRealNameAuthMapper.insert(entity);
        } else {
            memberRealNameAuthMapper.updateById(entity);
        }
        return toRecord(entity);
    }

    /**
     * 查询当前用户实名认证记录。
     *
     * @param userId 用户 ID
     * @return 实名记录
     */
    public RealNameAuthRecord getCurrentRecord(Long userId) {
        MemberRealNameAuthEntity entity = findByUserId(userId);
        return entity == null ? null : toRecord(entity);
    }

    /**
     * 查询全部实名认证记录。
     *
     * @return 实名列表
     */
    public List<RealNameAuthRecord> listAll() {
        return memberRealNameAuthMapper.selectList(null).stream()
                .map(this::toRecord)
                .sorted(Comparator.comparing(RealNameAuthRecord::submittedAt).reversed())
                .toList();
    }

    /**
     * 审核通过实名认证。
     *
     * @param authId 认证 ID
     * @return 审核结果
     */
    @Transactional
    public RealNameAuthRecord approve(Long authId) {
        MemberRealNameAuthEntity entity = getRequired(authId);
        entity.setStatus("APPROVED");
        entity.setReviewRemark(null);
        entity.setReviewedAt(LocalDateTime.now());
        memberRealNameAuthMapper.updateById(entity);
        userAccountService.addRole(entity.getUserId(), RoleCodes.CUSTOMER);
        return toRecord(entity);
    }

    /**
     * 驳回实名认证。
     *
     * @param authId 认证 ID
     * @param remark 驳回原因
     * @return 审核结果
     */
    @Transactional
    public RealNameAuthRecord reject(Long authId, String remark) {
        MemberRealNameAuthEntity entity = getRequired(authId);
        entity.setStatus("REJECTED");
        entity.setReviewRemark(remark);
        entity.setReviewedAt(LocalDateTime.now());
        memberRealNameAuthMapper.updateById(entity);
        return toRecord(entity);
    }

    private MemberRealNameAuthEntity findByUserId(Long userId) {
        return memberRealNameAuthMapper.selectOne(new LambdaQueryWrapper<MemberRealNameAuthEntity>()
                .eq(MemberRealNameAuthEntity::getUserId, userId)
                .last("limit 1"));
    }

    private MemberRealNameAuthEntity getRequired(Long authId) {
        MemberRealNameAuthEntity entity = memberRealNameAuthMapper.selectById(authId);
        if (entity == null) {
            throw new BusinessException("实名认证记录不存在");
        }
        return entity;
    }

    private RealNameAuthRecord toRecord(MemberRealNameAuthEntity entity) {
        return new RealNameAuthRecord(
                entity.getId(),
                entity.getUserId(),
                entity.getRealName(),
                entity.getIdCardNo(),
                entity.getStatus(),
                entity.getReviewRemark(),
                entity.getSubmittedAt(),
                entity.getReviewedAt());
    }

    public record RealNameAuthRecord(
            Long authId,
            Long userId,
            String realName,
            String idCardNo,
            String status,
            String reviewRemark,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt) {
    }
}
