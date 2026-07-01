package com.anudari.user_service.audit;

import com.anudari.common.constant.AppConstants;
import org.hibernate.envers.RevisionListener;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class CustomRevisionListener implements RevisionListener {

    @Override
    public void newRevision(Object revisionEntity) {
        CustomRevisionEntity rev = (CustomRevisionEntity) revisionEntity;
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            String username = attrs.getRequest().getHeader(AppConstants.HEADER.AUTH_USERNAME);
            rev.setModifiedBy(username != null && !username.isBlank() ? username : "system");
        } else {
            rev.setModifiedBy("system");
        }
    }
}