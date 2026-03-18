package com.propertystack.homematch.controller;

import com.propertystack.homematch.dto.PropertyDTO;
import com.propertystack.homematch.service.PropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.junit.jupiter.api.Test;

import java.util.List;

@WebMvcTest(PropertyController.class)
class PropertyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PropertyService propertyService;

    @Test
    void getProperties_returnsPaginatedResults() throws Exception {

        // --- Arrange ---
        List<PropertyDTO> properties = List.of(
                new PropertyDTO(),
                new PropertyDTO()
        );

        Page<PropertyDTO> page = new PageImpl<>(
                properties,
                PageRequest.of(0, 20),
                2
        );

        when(propertyService.getProperties(any(Pageable.class)))
                .thenReturn(page);

        // --- Act + Assert ---
        mockMvc.perform(get("/properties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.number").value(0));
    }
}