package com.anudari.common.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Audit {

    @CreatedBy
    @Column(name = "CREATED_BY", updatable = false)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "MODIFIED_BY")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String modifiedBy;

    @CreatedDate
    @Column(name = "CREATED_DATE", updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss.S")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDateTime createdDate;

    @LastModifiedDate
    @Column(name = "MODIFIED_DATE")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss.S")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDateTime modifiedDate;

    @Column(name = "DELETE_FLAG", length = 1, nullable = false)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String deleteFlag;
}