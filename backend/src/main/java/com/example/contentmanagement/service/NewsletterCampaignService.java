package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.NewsletterCampaignDTO;

import java.util.List;

public interface NewsletterCampaignService {
    NewsletterCampaignDTO createCampaign(NewsletterCampaignDTO newsletterCampaignDTO, String createdBy);
    List<NewsletterCampaignDTO> getAllCampaigns();
    NewsletterCampaignDTO dispatchCampaign(String campaignId);
    int dispatchDueCampaigns();
}
