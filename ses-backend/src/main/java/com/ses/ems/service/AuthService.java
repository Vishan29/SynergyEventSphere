package com.ses.ems.service;

import com.ses.ems.dto.auth.LoginRequest;
import com.ses.ems.dto.auth.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    void logout();

    void logoutAllSessions();
}
