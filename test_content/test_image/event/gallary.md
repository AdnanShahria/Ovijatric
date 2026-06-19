# Ovijatrik Test Content Data

This file contains 3 blogs, 3 gallery items, and 3 events along with references to their generated images located in `/test_content/images/`.

---

## 1. Blogs

### Blog 1: Exploring the Hidden Trails of Bandarban
* **Cover Image:** ![Bandarban Hiking](../../../images/blog1.png)
* **Excerpt:** Bandarban, a district in southeastern Bangladesh, is a haven for adventure seekers. Known for its beautiful hills, waterfalls, and indigenous culture...

### Blog 2: Sailing Through the Mangroves of Sundarbans
* **Cover Image:** ![Sundarbans Boat](../../../images/blog2.png)
* **Excerpt:** The Sundarbans, the largest mangrove forest in the world, is home to the majestic Royal Bengal Tiger. Our team embarked on a boat expedition...

### Blog 3: A Weekend Escape to the Tea Gardens of Sreemangal
* **Cover Image:** ![Sreemangal Tea Gardens](../../../images/blog3.png)
* **Excerpt:** Sreemangal, often referred to as the tea capital of Bangladesh, is perfect for a cycling and hiking weekend. We spent two days riding...

---

## 2. Gallery

### Photo 1: Saka Haphong Summit
* **Image:** ![Saka Haphong Summit](../../../images/gallery1.png)
* **Category:** Trekking
* **Caption:** Reaching the summit of Saka Haphong at sunrise

### Photo 2: Campfire at Remakri
* **Image:** ![Campfire at Remakri](../../../images/gallery2.png)
* **Category:** Camping
* **Caption:** Cozy bonfire night under the starry sky of Remakri

### Photo 3: Cycling in Sreemangal
* **Image:** ![Cycling in Sreemangal](../../../images/gallery3.png)
* **Category:** Cycling
* **Caption:** Pedaling through the rain-soaked tea gardens of Sreemangal

---

## 3. Events

### Event 1: RUET Adventure Club Annual Marathon 2026
* **Banner Image:** ![RUET Marathon](../../../images/event1.png)
* **Date:** August 15, 2026
* **Location:** RUET Campus Main Gate
* **Fee:** ৳300
* **Spots:** 200
* **Tags:** Running, Marathon, Fitness
* **Sponsors:** Runner BD, OrbitSaaS
* **Status:** Open

### Event 2: Bandarban Mountain Trekking Expedition
* **Banner Image:** ![Bandarban Trekking](../../../images/event2.png)
* **Date:** September 10, 2026
* **Location:** Dhaka to Bandarban
* **Fee:** ৳6500
* **Spots:** 30
* **Tags:** Trekking, Adventure, Bandarban
* **Sponsors:** Wilderness Gear
* **Status:** Open

### Event 3: Sundarbans Wildlife and Boat Expedition
* **Banner Image:** ![Sundarbans Expedition](../../../images/event3.png)
* **Date:** October 5, 2026
* **Location:** Khulna Launch Ghat
* **Fee:** ৳8500
* **Spots:** 45
* **Tags:** Wildlife, Boat Tour, Sundarbans
* **Sponsors:** Sundarbans Travels
* **Status:** Closed

---

## Bulk Upload JSON Payload

Copy the JSON block below and paste it into the **Bulk Upload** button text area on the Admin Dashboard page (`/admin`) to upload all 9 items at once.

```json
{
  "blogs": [
    {
      "title": "Exploring the Hidden Trails of Bandarban",
      "content": "Bandarban, a district in southeastern Bangladesh, is a haven for adventure seekers. Known for its beautiful hills, waterfalls, and indigenous culture, it offers challenging trekking routes. During our three-day expedition, we conquered several peaks and experienced local hospitality. The trails were steep, muddy, and demanding, but the view from the top made every drop of sweat worth it. We hope this guide inspires you to plan your own trek to the roof of Bangladesh."
    },
    {
      "title": "Sailing Through the Mangroves of Sundarbans",
      "content": "The Sundarbans, the largest mangrove forest in the world, is home to the majestic Royal Bengal Tiger. Our team embarked on a boat expedition to explore the narrow creeks and estuaries. We encountered diverse wildlife, including spotted deer, crocodiles, and exotic birds. Navigating the mysterious channels of the Sundarbans requires careful planning and respect for nature. Here is a compilation of our findings, maps, and safety tips for future travelers."
    },
    {
      "title": "A Weekend Escape to the Tea Gardens of Sreemangal",
      "content": "Sreemangal, often referred to as the tea capital of Bangladesh, is perfect for a cycling and hiking weekend. We spent two days riding through endless green tea estates, tasting the famous 7-layer tea, and hiking inside Lawachara National Park. The rain-soaked trails were lush and peaceful. Sreemangal is easily accessible and offers a rejuvenating experience for anyone looking to escape the bustle of city life."
    }
  ],
  "gallery": [
    {
      "category": "Trekking",
      "caption": "Reaching the summit of Saka Haphong at sunrise"
    },
    {
      "category": "Camping",
      "caption": "Cozy bonfire night under the starry sky of Remakri"
    },
    {
      "category": "Cycling",
      "caption": "Pedaling through the rain-soaked tea gardens of Sreemangal"
    }
  ],
  "events": [
    {
      "title": "RUET Adventure Club Annual Marathon 2026",
      "description": "Get ready for the biggest running event in Rajshahi! RUET Adventure Club is hosting its Annual Marathon 2026. This marathon aims to promote fitness, healthy living, and environmental awareness. Participants can choose between the 10K Challenge and the 5K Run. The route will cover the scenic bypass road and campus loops. Water stations, medical support, and custom finisher medals will be provided for all participants. Register now to secure your spot!",
      "date": "2026-08-15T06:00:00.000Z",
      "location": "RUET Campus Main Gate",
      "fee": "৳300",
      "total_spots": 200,
      "tags": "Running, Marathon, Fitness",
      "sponsors": "Runner BD, OrbitSaaS",
      "is_registration_open": true
    },
    {
      "title": "Bandarban Mountain Trekking Expedition",
      "description": "Join Ovijatrik for an extreme trekking adventure in the hills of Bandarban! We will conquer the trails of Amiakhum, Satvaikhum, and Nafakhum. This is a 4-day challenge designed for experienced trekkers. The package includes transportation, food, local guide fees, and shared cottage accommodations. Prepare to experience pure wilderness, river crossings, and breathtaking landscapes. Mandatory pre-expedition fitness test is required for all applicants.",
      "date": "2026-09-10T22:00:00.000Z",
      "location": "Dhaka to Bandarban",
      "fee": "৳6500",
      "total_spots": 30,
      "tags": "Trekking, Adventure, Bandarban",
      "sponsors": "Wilderness Gear",
      "is_registration_open": true
    },
    {
      "title": "Sundarbans Wildlife and Boat Expedition",
      "description": "Experience the mystery of the world's largest mangrove forest! Our Sundarbans Wildlife Expedition is a 3-day boat tour starting from Khulna. We will visit Kotka Wildlife Sanctuary, Kochikhali, and Harbaria eco-tourism spots. Activities include forest walks, bird watching, and wildlife photography. All meals will be served on the boat. Perfect for nature lovers and adventurers.",
      "date": "2026-10-05T08:00:00.000Z",
      "location": "Khulna Launch Ghat",
      "fee": "৳8500",
      "total_spots": 45,
      "tags": "Wildlife, Boat Tour, Sundarbans",
      "sponsors": "Sundarbans Travels",
      "is_registration_open": false
    }
  ]
}
```
