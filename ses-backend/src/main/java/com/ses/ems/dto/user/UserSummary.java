package com.ses.ems.dto.user;

import com.ses.ems.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSummary {

    private Long id;
    private String name;
    private String email;
    private Role role;
}
