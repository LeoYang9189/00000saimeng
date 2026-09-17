package com.saimeng.admin;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 经销商后台企业管理接口。
 */
@RestController
@RequestMapping("/api/distributor/enterprise/company")
public class DistributorEnterpriseCompanyController {

    private final DistributorEnterpriseCenterService distributorEnterpriseCenterService;

    public DistributorEnterpriseCompanyController(DistributorEnterpriseCenterService distributorEnterpriseCenterService) {
        this.distributorEnterpriseCenterService = distributorEnterpriseCenterService;
    }

    /**
     * 获取企业管理首页数据。
     *
     * @return 页面数据
     */
    @GetMapping("/bootstrap")
    public ApiResponse<DistributorEnterpriseCenterService.DistributorEnterpriseCompanyBootstrapPayload> getBootstrap() {
        return ApiResponse.success(distributorEnterpriseCenterService.getBootstrap(CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 搜索已存在企业。
     *
     * @param keyword 企业关键字
     * @return 企业列表
     */
    @GetMapping("/search")
    public ApiResponse<List<DistributorEnterpriseCenterService.EnterpriseSearchRecord>> searchEnterprises(
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(distributorEnterpriseCenterService.searchEnterprises(keyword));
    }

    /**
     * 提交新企业认证。
     *
     * @param request 认证请求
     * @return 认证申请
     */
    @PostMapping("/certification")
    public ApiResponse<DistributorEnterpriseCenterService.CertificationApplicationRecord> submitCertification(
            @RequestBody DistributorEnterpriseCenterService.EnterpriseCertificationSubmitRequest request) {
        return ApiResponse.success(distributorEnterpriseCenterService.submitCertification(
                CurrentUserContext.getCurrentUser().userId(),
                request));
    }

    /**
     * 提交加入企业申请。
     *
     * @param request 入企请求
     * @return 加入申请
     */
    @PostMapping("/join-requests")
    public ApiResponse<DistributorEnterpriseCenterService.JoinRequestRecord> submitJoinRequest(
            @RequestBody DistributorEnterpriseCenterService.EnterpriseJoinSubmitRequest request) {
        return ApiResponse.success(distributorEnterpriseCenterService.submitJoinRequest(
                CurrentUserContext.getCurrentUser().userId(),
                request));
    }
}
