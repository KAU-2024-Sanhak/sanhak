package com.project.sanhak.login.dto;

import com.project.sanhak.domain.user.OAuthToken;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private String username; // 사용자 이름
    private String provider; // 로그인한 서비스
    private String email; // 사용자의 이메일
    private String accessToken; // 액세스 토큰
    private String refreshToken; // 리프레시 토큰
    private LocalDateTime expireDate; // 토큰 만료 시간

    // DTO 파일을 통하여 Entity를 생성하는 메소드 (builder 없이)
    public OAuthToken toEntity() {
        OAuthToken oAuthToken = new OAuthToken();
        oAuthToken.setUsername(this.username);
        oAuthToken.setProvider(this.provider);
        oAuthToken.setEmail(this.email);
        oAuthToken.setAccessToken(this.accessToken); // access_token 설정
        oAuthToken.setRefreshToken(this.refreshToken); // refresh_token 설정
        oAuthToken.setExpireDate(String.valueOf(this.expireDate));
        return oAuthToken;
    }

}
