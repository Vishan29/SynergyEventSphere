package com.ses.ems.dto.venue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VenueSummary {

    private Long id;
    private String name;
    private String location;
    private Integer capacity;
}
