package com.enicarthage.incubator.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            Path copyLocation = Paths.get(uploadDir);
            if (!Files.exists(copyLocation)) {
                Files.createDirectories(copyLocation);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            // Use UUID to prevent filename collisions
            String fileName = UUID.randomUUID().toString() + extension;
            
            Files.copy(file.getInputStream(), copyLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(fileName);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Erreur lors de l'upload : " + e.getMessage());
        }
    }

    @GetMapping("/download/{*filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        if (filename.startsWith("/")) {
            filename = filename.substring(1);
        }
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = "application/octet-stream";
                if (filename.toLowerCase().endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (filename.toLowerCase().endsWith(".png")) {
                    contentType = "image/png";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
