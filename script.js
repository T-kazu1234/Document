window.onload()
    fetch("https://scrapbox.io/api/pages/help-jp/API/text",
      {
          method: 'POST',
          body: ""
      }
    )
    console("fetchを通った")
