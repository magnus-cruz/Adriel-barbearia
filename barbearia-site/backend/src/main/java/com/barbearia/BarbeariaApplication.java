package com.barbearia;

import com.barbearia.service.JsonDataStore;
import com.barbearia.service.MidiaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.io.File;
import java.nio.file.Path;

@SpringBootApplication
public class BarbeariaApplication {

    public static void main(String[] args) {
        SpringApplication.run(BarbeariaApplication.class, args);
    }

    @Bean
    ApplicationRunner startupChecklist(MidiaService midiaService,
                                       JsonDataStore jsonDataStore,
                                       @Value("${data.dir:data}") String dataDirConfig) {
        return args -> {
            midiaService.garantirPastaUpload();
            Path uploadPath = midiaService.getUploadPath().toAbsolutePath();
            File dataDir = new File(System.getProperty("user.dir"), dataDirConfig);
            dataDir.mkdirs();

            System.out.println("\n================ CHECKLIST LOCAL ================");
            System.out.println("✅ Servidor rodando em http://localhost:8080");
            System.out.println("✅ Pasta uploads/ pronta em: " + uploadPath);
            System.out.println("✅ Dados JSON em: " + jsonDataStore.getDataDir().toAbsolutePath());
            System.out.println("✅ CORS liberado para desenvolvimento local");
            System.out.println("✅ Abra o frontend em http://127.0.0.1:5500");
            System.out.println("=================================================\n");
        };
    }
}
