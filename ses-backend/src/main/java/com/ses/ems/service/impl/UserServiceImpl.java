package com.ses.ems.service.impl;

import com.ses.ems.dto.user.CreateUserRequest;
import com.ses.ems.dto.user.CreateUserResponse;
import com.ses.ems.dto.user.UserProfile;
import com.ses.ems.dto.user.UserSummary;
import com.ses.ems.exception.EmailAlreadyExistsException;
import com.ses.ems.exception.UserNotFoundException;
import com.ses.ems.mapper.UserMapper;
import com.ses.ems.model.User;
import com.ses.ems.repository.UserRepository;
import com.ses.ems.service.UserService;
import com.ses.ems.util.AuthenticatedUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticatedUserUtil authenticatedUserUtil;

    @Override
    @Transactional
    public CreateUserResponse register(CreateUserRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }
        request.setEmail(normalizedEmail);

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User entity = userMapper.toEntity(request, encodedPassword);
        User saved = userRepository.save(entity);

        return userMapper.toCreateResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return userMapper.toProfile(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getCurrent() {
        User current = authenticatedUserUtil.requireCurrentUser();
        return userMapper.toProfile(current);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummary> getAll() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getId))
                .map(userMapper::toSummary)
                .toList();
    }
}
