package com.saimeng.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.saimeng")
@MapperScan({
        "com.saimeng.admin.mapper",
        "com.saimeng.ai.mapper",
        "com.saimeng.system.mapper",
        "com.saimeng.member.mapper",
        "com.saimeng.merchant.mapper",
        "com.saimeng.product.mapper"
})
public class SaimengAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaimengAdminApplication.class, args);
    }
}
