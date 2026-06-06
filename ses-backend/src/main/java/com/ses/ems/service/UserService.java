package com.ses.ems.service;

import com.ses.ems.dto.user.CreateUserRequest;
import com.ses.ems.dto.user.CreateUserResponse;
import com.ses.ems.dto.user.UserProfile;
import com.ses.ems.dto.user.UserSummary;

import java.util.List;

public interface UserService {

    CreateUserResponse register(CreateUserRequest request);

    UserProfile getById(Long id);

    UserProfile getCurrent();

    List<UserSummary> getAll();
}
