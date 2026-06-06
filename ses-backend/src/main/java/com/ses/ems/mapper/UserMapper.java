package com.ses.ems.mapper;

import com.ses.ems.dto.user.CreateUserRequest;
import com.ses.ems.dto.user.CreateUserResponse;
import com.ses.ems.dto.user.UserProfile;
import com.ses.ems.dto.user.UserSummary;
import com.ses.ems.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(CreateUserRequest request, String encodedPassword) {
        return User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(encodedPassword)
                .role(request.getRole())
                .contactNo(normalizeContactNo(request.getContactNo()))
                .build();
    }

    public UserProfile toProfile(User user) {
        return UserProfile.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .contactNo(user.getContactNo())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public UserSummary toSummary(User user) {
        return UserSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public CreateUserResponse toCreateResponse(User user) {
        return CreateUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String normalizeContactNo(String contactNo) {
        if (contactNo == null) {
            return null;
        }
        String trimmed = contactNo.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
