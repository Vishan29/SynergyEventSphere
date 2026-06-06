package com.ses.ems.dto.user;

import com.ses.ems.model.enums.Role;
import com.ses.ems.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email must be at most 150 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @StrongPassword
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @Pattern(
            regexp = "^$|^\\+?[0-9\\-\\s]{7,20}$",
            message = "Contact number must be 7-20 digits and may start with +"
    )
    private String contactNo;
}
