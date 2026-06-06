package com.ses.ems.dto.user;

import com.ses.ems.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfile {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String contactNo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
