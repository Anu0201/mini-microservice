package com.anudari.payment_service.entity;

import com.anudari.common.entity.Audit;
import com.anudari.common.constant.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Audited
@Entity
@Table(name = "invoices")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Invoice extends Audit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long invoiceId;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "sender_account_id")
    private Long senderAccountId;

    @Column(name = "receiver_account_id")
    private Long receiverAccountId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency = "MNT";

    @Column(length = 20)
    private InvoiceStatus status = new InvoiceStatus.Unpaid();

    private String description;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();
}