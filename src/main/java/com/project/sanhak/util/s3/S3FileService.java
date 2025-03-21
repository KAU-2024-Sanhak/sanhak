package com.project.sanhak.util.s3;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import com.amazonaws.util.IOUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Component
@Service
public class S3FileService {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucketName}")
    private String bucketName;

    public String upload(MultipartFile file) {
        if (file.isEmpty() || Objects.isNull(file.getOriginalFilename())) {
            throw new S3Exception(ErrorCode.EMPTY_FILE_EXCEPTION);
        }
        return this.uploadFile(file);
    }

    private String uploadFile(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        String extension = validateFileExtension(fileName);
        try {
            return this.uploadToS3(file, extension);
        } catch (IOException e) {
            throw new S3Exception(ErrorCode.IO_EXCEPTION_ON_FILE_UPLOAD);
        }
    }

    private String validateFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            throw new S3Exception(ErrorCode.NO_FILE_EXTENSION);
        }

        String extension = filename.substring(lastDotIndex + 1).toLowerCase();
        List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "gif", "pdf");

        if (!allowedExtensions.contains(extension)) {
            throw new S3Exception(ErrorCode.INVALID_FILE_EXTENSION);
        }

        return extension;
    }

    private String uploadToS3(MultipartFile file, String extension) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String s3FileName = UUID.randomUUID().toString().substring(0, 10) + originalFilename;

        InputStream is = file.getInputStream();
        byte[] bytes = IOUtils.toByteArray(is);

        ObjectMetadata metadata = new ObjectMetadata();
        if ("pdf".equals(extension)) {
            metadata.setContentType("application/pdf");
        } else {
            metadata.setContentType("image/" + extension);
        }
        metadata.setContentLength(bytes.length);

        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);

        try {
            PutObjectRequest putObjectRequest =
                    new PutObjectRequest(bucketName, s3FileName, byteArrayInputStream, metadata)
                            .withCannedAcl(CannedAccessControlList.PublicRead);
            amazonS3.putObject(putObjectRequest);
        } catch (Exception e) {
            throw new S3Exception(ErrorCode.PUT_OBJECT_EXCEPTION);
        } finally {
            byteArrayInputStream.close();
            is.close();
        }

        return amazonS3.getUrl(bucketName, s3FileName).toString();
    }

    public void deleteFileFromS3(String fileAddress) {
        String key = getKeyFromFileAddress(fileAddress);
        try {
            amazonS3.deleteObject(new DeleteObjectRequest(bucketName, key));
        } catch (Exception e) {
            throw new S3Exception(ErrorCode.IO_EXCEPTION_ON_FILE_DELETE);
        }
    }

    private String getKeyFromFileAddress(String fileAddress) {
        try {
            URL url = new URL(fileAddress);
            String decodingKey = URLDecoder.decode(url.getPath(), StandardCharsets.UTF_8);
            return decodingKey.substring(1); // 맨 앞의 '/' 제거
        } catch (MalformedURLException e) {
            throw new S3Exception(ErrorCode.IO_EXCEPTION_ON_FILE_DELETE);
        }
    }

    public MultipartFile downloadFileAsMultipartFile(String fileUrl) {
        try {
            String key = getKeyFromFileAddress(fileUrl); // 파일 경로로부터 S3 키를 추출
            S3Object s3Object = amazonS3.getObject(bucketName, key); // S3에서 파일 다운로드
            InputStream inputStream = s3Object.getObjectContent();

            return new MockMultipartFile(
                    key,                          // 파일 이름
                    key,                          // 원본 파일 이름
                    s3Object.getObjectMetadata().getContentType(), // 파일 유형
                    inputStream                   // 파일 내용
            );
        } catch (Exception e) {
            log.error("파일 다운로드 실패: {}", e.getMessage());
            throw new S3Exception(ErrorCode.IO_EXCEPTION_ON_FILE_DOWNLOAD);
        }
    }
}
