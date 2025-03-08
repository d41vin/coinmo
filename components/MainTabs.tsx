import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MainTabs() {
  return (
    <Tabs defaultValue="activity" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="groups">Groups</TabsTrigger>
      </TabsList>
      
      <TabsContent value="activity">
        <ActivityFeed />
      </TabsContent>
      
      <TabsContent value="contacts">
        <ContactsList />
      </TabsContent>
      
      <TabsContent value="groups">
        <GroupsList />
      </TabsContent>
    </Tabs>
  );
}