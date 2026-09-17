package com.saimeng.admin;

import com.saimeng.auth.CurrentUserContext;
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
 * 经销商后台员工管理接口。
 */
@RestController
@RequestMapping("/api/distributor/enterprise/employees")
public class DistributorEmployeeController {

    private final DistributorEmployeeService distributorEmployeeService;

    public DistributorEmployeeController(DistributorEmployeeService distributorEmployeeService) {
        this.distributorEmployeeService = distributorEmployeeService;
    }

    /**
     * 获取当前企业员工初始化数据。
     *
     * @return 初始化数据
     */
    @GetMapping("/bootstrap")
    public ApiResponse<DistributorEmployeeService.DistributorEmployeeBootstrapPayload> getBootstrap() {
        return ApiResponse.success(distributorEmployeeService.getBootstrap(CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 新增员工。
     *
     * @param request 请求
     * @return 员工记录
     */
    @PostMapping
    public ApiResponse<DistributorEmployeeService.DistributorEmployeeRecord> createEmployee(
            @RequestBody DistributorEmployeeService.DistributorEmployeeUpsertRequest request) {
        return ApiResponse.success(distributorEmployeeService.createEmployee(
                CurrentUserContext.getCurrentUser().userId(),
                request));
    }

    /**
     * 更新员工。
     *
     * @param userId 用户 ID
     * @param request 请求
     * @return 员工记录
     */
    @PutMapping("/{userId}")
    public ApiResponse<DistributorEmployeeService.DistributorEmployeeRecord> updateEmployee(
            @PathVariable Long userId,
            @RequestBody DistributorEmployeeService.DistributorEmployeeUpsertRequest request) {
        return ApiResponse.success(distributorEmployeeService.updateEmployee(
                CurrentUserContext.getCurrentUser().userId(),
                userId,
                request));
    }

    /**
     * 移除员工。
     *
     * @param userId 用户 ID
     * @return 空响应
     */
    @DeleteMapping("/{userId}")
    public ApiResponse<Void> deleteEmployee(@PathVariable Long userId) {
        distributorEmployeeService.deleteEmployee(CurrentUserContext.getCurrentUser().userId(), userId);
        return ApiResponse.success(null);
    }

    /**
     * 通过加入企业申请。
     *
     * @param requestId 申请 ID
     * @return 空响应
     */
    @PostMapping("/join-requests/{requestId}/approve")
    public ApiResponse<Void> approveJoinRequest(@PathVariable Long requestId) {
        distributorEmployeeService.approveJoinRequest(CurrentUserContext.getCurrentUser().userId(), requestId);
        return ApiResponse.success(null);
    }

    /**
     * 驳回加入企业申请。
     *
     * @param requestId 申请 ID
     * @param request 驳回请求
     * @return 空响应
     */
    @PostMapping("/join-requests/{requestId}/reject")
    public ApiResponse<Void> rejectJoinRequest(
            @PathVariable Long requestId,
            @RequestBody DistributorEmployeeService.JoinRequestReviewRequest request) {
        distributorEmployeeService.rejectJoinRequest(
                CurrentUserContext.getCurrentUser().userId(),
                requestId,
                request.reviewRemark());
        return ApiResponse.success(null);
    }

    /**
     * 移交企业超级管理员。
     *
     * @param userId 目标用户 ID
     * @return 空响应
     */
    @PostMapping("/{userId}/transfer-super-admin")
    public ApiResponse<Void> transferSuperAdmin(@PathVariable Long userId) {
        distributorEmployeeService.transferSuperAdmin(CurrentUserContext.getCurrentUser().userId(), userId);
        return ApiResponse.success(null);
    }
}
