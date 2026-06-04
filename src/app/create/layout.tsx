import { CreateDraftProvider } from "@/components/create/create-draft-context";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CreateDraftProvider>{children}</CreateDraftProvider>;
}
