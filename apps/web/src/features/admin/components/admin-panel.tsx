import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { AttributeEditor } from "./attributes/attribute-editor";
import CSVUpload from "./csv/csv-upload";
import { RoomGroupEditor } from "./groups/room-group-editor";
import Overview from "./overview/overview";
import UserEditor from "./users/user-editor";

const supervisorTabs = ["overview", "csv", "attributes", "groups"];

export default function AdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const storeLastTab = (tab: string) => localStorage.setItem("adminLastTab", tab);
  const storedTab = localStorage.getItem("adminLastTab");
  const allowedTabs = isAdmin ? [...supervisorTabs, "users"] : supervisorTabs;
  const lastTab = storedTab && allowedTabs.includes(storedTab) ? storedTab : "overview";
  return (
    <div className="flex justify-center">
      <Tabs defaultValue={lastTab} orientation="vertical" onValueChange={storeLastTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          <TabsTrigger value="attributes">Room Attributes</TabsTrigger>
          <TabsTrigger value="groups">Room Groups</TabsTrigger>
          <TabsTrigger disabled value="statistics">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Overview />
        </TabsContent>
        <TabsContent value="csv">
          <CSVUpload />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="users">
            <UserEditor />
          </TabsContent>
        )}
        <TabsContent value="attributes">
          <AttributeEditor />
        </TabsContent>
        <TabsContent value="groups">
          <RoomGroupEditor />
        </TabsContent>
        {/*<TabsContent value="statistics">*/}
        {/*  <Statistics />*/}
        {/*</TabsContent>*/}
      </Tabs>
    </div>
  );
}
