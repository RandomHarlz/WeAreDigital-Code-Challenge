# Technical Challenge

🌐 Demo site: [https://harley-crispin-wearedigital.myshopify.com/](https://harley-crispin-wearedigital.myshopify.com/)

🔐 Password: `code-challenge`

## Level 1 - Update Checkout Headings

**Steps to complete**

- During the demo site setup, it is required that the site be configured with the _Build Version_ set to _Developer Preview_ with _Checkout and Customer Accounts Extensibility_ selected
- The _Shopify GraphiQL App_ must be installed on the demo site with `read_checkout_branding_settings` and `write_checkout_branding_settings` enabled in the _Selected scopes_ of the _Admin API_ during the installation
- Within the Shopify GraphiQL App of the store Admin first we must retrieve the Checkout Profile ID using the following GraphQL query:
  ```graphql
  query checkoutProfile {
    checkoutProfiles(first: 10) {
      edges {
        node {
          id
          name
          isPublished
        }
      }
    }
  }
  ```
- Then recording the ID of the checkoutProfile we want to update, we can run the following mutation to update the Checkout Branding:
  ```graphql
  mutation checkoutBrandingUpsert(
    $checkoutBrandingInput: CheckoutBrandingInput!
    $checkoutProfileId: ID!
  ) {
    checkoutBrandingUpsert(
      checkoutBrandingInput: $checkoutBrandingInput
      checkoutProfileId: $checkoutProfileId
    ) {
      checkoutBranding {
        customizations {
          headingLevel1 {
            typography {
              letterCase
            }
          }
          headingLevel2 {
            typography {
              letterCase
            }
          }
          headingLevel3 {
            typography {
              letterCase
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
  ```
  Parsing the following object as a variable using the Checkout Profile ID from the previous GraphQL query.
  ```json
  {
    // Checkout Profile ID from the previous query
    "checkoutProfileId": "gid://shopify/CheckoutProfile/17727542",
    "checkoutBrandingInput": {
      "customizations": {
        "headingLevel1": {
          "typography": {
            "letterCase": "UPPER"
          }
        },
        "headingLevel2": {
          "typography": {
            "letterCase": "UPPER"
          }
        },
        // Heading level 3 doesn't appear to be utilised on the onepage checkout template,
        // but I've included this so that *all* headings are updated to uppercase,
        // as per the challenge details
        "headingLevel3": {
          "typography": {
            "letterCase": "UPPER"
          }
        }
      }
    }
  }
  ```

## Level 2 - Conditionally Remove a Payment Option From Checkout

See functionality in action [here](https://www.loom.com/share/2e7ef9eefae94d1293fd97343da0b2ed?sid=a7eb4359-73ae-4bca-b523-6dc8a3ac9e9e)

**Shopify config**

- Admin users are able to configure this checkout extension within the Shopify site dashboard by going to **_Settings > Payments > Payment method customizations_** and clicking **_Add a customization_** and selecting **_payment-customization_** from the template list.
- The payment method is available to be entered as a text string to match the desired payment method to be hidden - **_Afterpay_** in this case.
- Then multiple products are able to be selected that will hide the payment method when they are present in the cart using a product selector popup. Admin users are able to select whole products or specific variants from this popup.
- If any of these products are present in the cart then the payment method will be unavailable for selection.

**Additional notes**

- I’ve deployed this to [fly.io](http://fly.io) so it is accessible on the demo site for testing
- This extension allows for multiple customisations to be added for different payment methods, giving store admins greater flexibility in adjusting the visibility of multiple payment methods at once
- The current design could be improved by allowing the Admin user to be able to select the payment method from a drop down instead of manually typing the name of the payment method
