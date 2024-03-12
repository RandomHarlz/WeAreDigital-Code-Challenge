import { useEffect, useState } from "react";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  FormLayout,
  Layout,
  Page,
  ResourceItem,
  ResourceList,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ImageIcon } from "@shopify/polaris-icons";

export const loader = async ({ params, request }) => {
  const { id } = params;

  if (id === "new") {
    return {
      paymentMethodName: "",
      products: [],
    };
  }

  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
      query getPaymentCustomization($id: ID!) {
        paymentCustomization (id: $id) {
          id
          metafield(namespace: "$app:payment-customization", key: "function-configuration") {
            value
          }
        }
      }
    `,
    {
      variables: {
        id: `gid://shopify/PaymentCustomization/${id}`,
      },
    },
  );

  const responseJson = await response.json();
  const metafield =
    responseJson.data.paymentCustomization?.metafield?.value &&
    JSON.parse(responseJson.data.paymentCustomization.metafield.value);

  return json({
    paymentMethodName: metafield?.paymentMethodName ?? "",
    products: JSON.parse(metafield?.products) ?? [],
  });
};

export const action = async ({ params, request }) => {
  const { functionId, id } = params;
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const paymentMethodName = formData.get("paymentMethodName");
  const products = formData.get("products");

  const paymentCustomizationInput = {
    functionId,
    title: `Hide ${paymentMethodName} if selected products are in the cart`,
    enabled: true,
    metafields: [
      {
        namespace: "$app:payment-customization",
        key: "function-configuration",
        type: "json",
        value: JSON.stringify({
          paymentMethodName,
          products,
        }),
      },
    ],
  };

  if (id === "new") {
    const response = await admin.graphql(
      `#graphql
      mutation createPaymentCustomization($input: PaymentCustomizationInput!) {
        paymentCustomizationCreate(paymentCustomization: $input) {
          paymentCustomization {
            id
          }
          userErrors {
            message
          }
        }
      }`,
      {
        variables: {
          input: paymentCustomizationInput,
        },
      },
    );

    const responseJson = await response.json();
    const errors = responseJson.data.paymentCustomizationCreate?.userErrors;

    return json({ errors });
  } else {
    const response = await admin.graphql(
      `#graphql
      mutation updatePaymentCustomization($id: ID!, $input: PaymentCustomizationInput!) {
        paymentCustomizationUpdate(id: $id, paymentCustomization: $input) {
          paymentCustomization {
            id
          }
          userErrors {
            message
          }
        }
      }`,
      {
        variables: {
          id: `gid://shopify/PaymentCustomization/${id}`,
          input: paymentCustomizationInput,
        },
      },
    );

    const responseJson = await response.json();
    const errors = responseJson.data.paymentCustomizationUpdate?.userErrors;

    return json({ errors });
  }
};

// COMPONENTS START
const EmptyProductsState = ({ onAction, disabled }) => (
  <EmptyState
    heading="Select products that will be unavailable with your payment method"
    action={{
      content: "Select products",
      onAction,
      disabled,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>
      Prevent customers from using your selected payment method when these items
      are in their cart.
    </p>
  </EmptyState>
);

const ProductsTable = ({ products, onAction, disabled }) => (
  <ResourceList
    resourceName={{
      singular: "Product",
      plural: "Products",
    }}
    items={products}
    renderItem={ProductRow}
    selectable={false}
    alternateTool={
      <Button variant="secondary" onClick={onAction} disabled={disabled}>
        Select products
      </Button>
    }
  />
);

const ProductRow = ({ id, image, alt, title }) => (
  <ResourceItem
    id={id}
    media={<Thumbnail source={image || ImageIcon} alt={alt} size="small" />}
  >
    <Text variant="bodyMd" fontWeight="bold" as="h3">
      {title}
    </Text>
  </ResourceItem>
);

const ErrorBanner = ({ errors }) => (
  <Layout.Section>
    <Banner
      title="There was an error creating the customization."
      status="Critical"
    >
      <ul>
        {errors.map((error, index) => {
          return <li key={`${index}`}>{error.message}</li>;
        })}
      </ul>
    </Banner>
  </Layout.Section>
);
// COMPONENTS END

export default function PaymentCustomization() {
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const loaderData = useLoaderData();
  const [paymentMethodName, setPaymentMethodName] = useState(
    loaderData.paymentMethodName,
  );
  const [products, setProducts] = useState(loaderData.products);

  const isLoading = navigation.state === "submitting";

  const errorBanner = actionData?.errors.length ? (
    <ErrorBanner errors={actionData?.errors} />
  ) : null;

  async function selectProducts() {
    const updatedProducts = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
      selectionIds: products,
    });

    setProducts(
      updatedProducts.map((product) => ({
        id: product.id,
        image: product.images?.[0]?.originalSrc,
        alt: product.images?.[0]?.alt,
        title: product.title,
        variants: product.variants.map((variant) => ({
          id: variant.id,
        })),
      })),
    );
  }

  const handleSubmit = () => {
    submit(
      {
        paymentMethodName,
        products: JSON.stringify(products),
      },
      { method: "post" },
    );
  };

  useEffect(() => {
    if (actionData?.errors.length === 0) {
      open("shopify:admin/settings/payments/customizations", "_top");
    }
  }, [actionData?.errors]);

  return (
    <Page
      title="Hide payment method"
      backAction={{
        content: "Payment customization",
        onAction: () =>
          open("shopify:admin/settings/payments/customizations", "_top"),
      }}
      primaryAction={{
        content: "Save",
        loading: isLoading,
        onAction: handleSubmit,
      }}
    >
      <Layout>
        {errorBanner}
        <Layout.Section>
          <Card>
            <Form method="post">
              <FormLayout>
                <FormLayout.Group>
                  <TextField
                    name="paymentMethodName"
                    type="text"
                    label="Payment method"
                    value={paymentMethodName}
                    onChange={setPaymentMethodName}
                    disabled={isLoading}
                    autoComplete="on"
                    requiredIndicator
                  />
                </FormLayout.Group>
                {products.length ? (
                  <ProductsTable
                    products={products}
                    onAction={selectProducts}
                    disabled={isLoading}
                  />
                ) : (
                  <EmptyProductsState
                    onAction={selectProducts}
                    disabled={isLoading}
                  />
                )}
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
