package com.anudari.common.constant;

public sealed interface InvoiceStatus permits InvoiceStatus.Unpaid, InvoiceStatus.Paid, InvoiceStatus.Cancelled {

    String value();

    record Unpaid()    implements InvoiceStatus { public String value() { return "UNPAID"; } }
    record Paid()      implements InvoiceStatus { public String value() { return "PAID"; } }
    record Cancelled() implements InvoiceStatus { public String value() { return "CANCELLED"; } }
}