package com.enicarthage.incubator.repository;

import com.enicarthage.incubator.model.Project;
import com.enicarthage.incubator.model.ProjectStatus;
import com.enicarthage.incubator.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ProjectRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    void shouldFindProjectsByOwnerId() {
        // Given
        User owner = new User();
        owner.setEmail("test@test.com");
        owner.setPassword("password");
        owner.setFirstName("Test");
        owner.setLastName("User");
        owner.setRole(com.enicarthage.incubator.model.Role.STUDENT);
        entityManager.persist(owner);

        Project project = new Project();
        project.setTitle("Test Project");
        project.setDescription("Test Description");
        project.setOwner(owner);
        project.setStatus(ProjectStatus.SUBMITTED);
        entityManager.persist(project);
        entityManager.flush();

        // When
        List<Project> foundProjects = projectRepository.findByOwnerId(owner.getId());

        // Then
        assertThat(foundProjects).hasSize(1);
        assertThat(foundProjects.get(0).getTitle()).isEqualTo("Test Project");
    }

    @Test
    void shouldFindProjectsByStatus() {
        // Given
        User owner = new User();
        owner.setEmail("status@test.com");
        owner.setPassword("password");
        owner.setFirstName("Status");
        owner.setLastName("User");
        owner.setRole(com.enicarthage.incubator.model.Role.STUDENT);
        entityManager.persist(owner);

        Project project1 = new Project();
        project1.setTitle("Accepted Project");
        project1.setStatus(ProjectStatus.ACCEPTED);
        project1.setOwner(owner);
        entityManager.persist(project1);

        Project project2 = new Project();
        project2.setTitle("Submitted Project");
        project2.setStatus(ProjectStatus.SUBMITTED);
        project2.setOwner(owner);
        entityManager.persist(project2);
        
        entityManager.flush();

        // When
        List<Project> acceptedProjects = projectRepository.findByStatus(ProjectStatus.ACCEPTED);

        // Then
        assertThat(acceptedProjects).hasSize(1);
        assertThat(acceptedProjects.get(0).getTitle()).isEqualTo("Accepted Project");
    }
}
