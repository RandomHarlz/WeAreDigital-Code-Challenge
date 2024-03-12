import { Card, Layout, Page } from "@shopify/polaris";

export default function Index() {
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card padding="500">
            <span>
              {"Go to "}
              <em>
                <b>Settings</b>
              </em>
              {" > "}
              <em>
                <b>Payments</b>
              </em>
              {" > "}
              <em>
                <b>Payment method customizations</b>
              </em>
              {" to manage the settings for this app"}
            </span>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
