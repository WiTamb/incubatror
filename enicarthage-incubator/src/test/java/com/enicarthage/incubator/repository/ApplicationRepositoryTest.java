package com.enicarthage.incubator.repository;

import com.enicarthage.incubator.model.Application;
import com.enicarthage.incubator.model.ApplicationStatus;
import com.enicarthage.incubator.model.Session;
import com.enicarthage.incubator.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ApplicationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    void shouldFindApplicationsBySessionId() {
        // Given
        Session session = new Session();
        session.setName("Test Session");
        session.setStartDate(java.time.LocalDate.now());
        session.setEndDate(java.time.LocalDate.now().plusDays(30));
        session = entityManager.persistAndFlush(session);

        User candidate = new User();
        candidate.setEmail("candidate@test.com");
        candidate.setPassword("password");
        candidate.setFirstName("Cand");
        candidate.setLastName("Idate");
        candidate.setRole(com.enicarthage.incubator.model.Role.STUDENT);
        candidate = entityManager.persistAndFlush(candidate);

        Application application = new Application();
        application.setSession(session);
        application.setCandidate(candidate);
        application.setStatus(ApplicationStatus.PENDING);
        entityManager.persistAndFlush(application);

        // When
        List<Application> applications = applicationRepository.findBySessionId(session.getId());

        // Then
        assertThat(applications).hasSize(1);
        assertThat(applications.get(0).getCandidate().getEmail()).isEqualTo("candidate@test.com");
    }
}
