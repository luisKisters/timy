"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectButton,
  SelectItem,
  SelectPopup,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const EXPIRY_OPTIONS = [
  { label: "1 day", value: "1d" },
  { label: "3 days", value: "3d" },
  { label: "1 week", value: "1w" },
  { label: "Never", value: "never" },
];

export function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState("3d");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. Team lunch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Expiry</Label>
          <Select value={expiry} onValueChange={(v) => v && setExpiry(v)}>
            <SelectButton>
              <SelectValue placeholder="Select expiry" />
            </SelectButton>
            <SelectPopup>
              {EXPIRY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!title.trim()}
          onClick={() => {
            const params = new URLSearchParams({ title, description, expiry });
            router.push(`/create/slots?${params.toString()}`);
          }}
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
